import { OrbitControls } from './module/OrbitControls.js';
import * as THREE from './module/three.module.min.js';

document.addEventListener("DOMContentLoaded", function() {
    const timeSelect = document.getElementById('time-select');
    const b = -1.2907;
    const a = -3.5409;
    let predictionChart = null;

    // Fetch available times and populate the select dropdown
    fetch('/api/available-times')
        .then(response => response.json())
        .then(times => {
            times.forEach(time => {
                const option = document.createElement('option');
                option.value = time.value;
                option.text = time.label;
                timeSelect.appendChild(option);
            });
            // Load data for the first available time
            if (times.length > 0) {
                loadTemperatureData(times[0].value);
                loadPredictionData(times[0].value);
            }
        })
        .catch(error => {
            console.error('Error fetching available times:', error);
        });

    // Event listener for time selection change
    timeSelect.addEventListener('change', (event) => {
        const selectedTime = event.target.value;
        loadTemperatureData(selectedTime);
        loadPredictionData(selectedTime);
    });

    function loadTemperatureData(time) {
        fetch(`/api/temperature/${time}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                draw3DHeatmap(data);
                const surfaceData = data.filter(point => Math.abs(point.z - 2.4) < 0.01);
                draw2DHeatmap(surfaceData);
                draw2DIceProbabilityMap(surfaceData);
            })
            .catch(error => {
                console.error('Error fetching temperature data:', error);
            });
    }

    function loadPredictionData(time) {
        fetch(`/api/prediction/${time}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No prediction data available');
                }
                return response.json();
            })
            .then(predictionData => {
                if (predictionData.length === 0) {
                    clearPredictionChart();
                    clearWarningMessage();
                    return;
                }
                drawPredictionChart(predictionData);
                displayWarningMessage(predictionData);
            })
            .catch(error => {
                console.error('Error fetching prediction data:', error);
                clearPredictionChart();
                clearWarningMessage();
            });
    }

    function getTemperatureRange(data) {
        const temperatures = data.map(point => point.temperature);
        const minTemp = Math.min(...temperatures);
        const maxTemp = Math.max(...temperatures);
        return { minTemp, maxTemp };
    }

    function draw3DHeatmap(data) {
        const container = document.getElementById('3d-heatmap');
        container.innerHTML = ''; // 清空之前的渲染内容
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        camera.up.set(0, 0, 1);
        camera.position.set(4.5, -5, 4);
        const lookAtPosition = new THREE.Vector3(4.5, 1.5, 2.0);
        camera.lookAt(lookAtPosition);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        container.appendChild(renderer.domElement);

        const { minTemp, maxTemp } = getTemperatureRange(data);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 2;
        controls.update();

        const boxSize = 0.4;
        data.forEach(point => {
            const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
            const material = new THREE.MeshBasicMaterial({ color: getColorForTemperature(point.temperature, minTemp, maxTemp) });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(point.x, point.y, point.z);
            scene.add(cube);
        });

        drawColorLegend(container, minTemp, maxTemp, 'absolute', '-60px', '10px');
        const animate = function () {
            requestAnimationFrame(animate);
            controls.target.copy(lookAtPosition);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();
    }

    function getColorForTemperature(temperature, minTemp, maxTemp) {
        const normalizedTemp = (temperature - minTemp) / (maxTemp - minTemp);

        const blue = new THREE.Color(0x0000ff);
        const green = new THREE.Color(0x00ff00);
        const red = new THREE.Color(0xff0000);

        if (normalizedTemp < 0.5) {
            return blue.lerp(green, normalizedTemp * 2);
        } else {
            return green.lerp(red, (normalizedTemp - 0.5) * 2);
        }
    }

    function draw2DHeatmap(surfaceData) {
        const heatmapContainer = document.getElementById('2d-heatmap');
        heatmapContainer.innerHTML = '';
        const heatmapInstance = h337.create({
            container: heatmapContainer,
            radius: 90,
            maxOpacity: 0.8,
            minOpacity: 0.4,
            blur: 0.6,
            width: heatmapContainer.offsetWidth,
            height: heatmapContainer.offsetHeight,
        });

        const { minTemp, maxTemp } = getTemperatureRange(surfaceData);
        const dataWidth = 9;
        const dataHeight = 3;

        const heatmapData = {
            max: maxTemp,
            min: minTemp,
            data: surfaceData.map(point => ({
                x: (point.x / dataWidth) * heatmapContainer.offsetWidth,
                y: (point.y / dataHeight) * heatmapContainer.offsetHeight,
                value: point.temperature
            }))
        };

        heatmapInstance.setData(heatmapData);
        drawColorLegend(heatmapContainer, minTemp, maxTemp, 'absolute', '-60px', '10px');
    }

    function drawColorLegend(container, minTemp, maxTemp, position, bottom, left) {
        const legendWidth = 600;
        const legendHeight = 50;
        const legendCanvas = document.createElement('canvas');
        legendCanvas.width = legendWidth;
        legendCanvas.height = legendHeight;
        legendCanvas.style.position = position;
        legendCanvas.style.bottom = bottom;
        legendCanvas.style.left = left;
        const ctx = legendCanvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, legendWidth, 0);
        gradient.addColorStop(0, 'blue');
        gradient.addColorStop(0.5, 'green');
        gradient.addColorStop(1, 'red');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 10, legendWidth, 20);

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const numLabels = 7;
        for (let i = 0; i <= numLabels; i++) {
            const x = (i / numLabels) * (legendWidth-96) + 48;
            const temp = minTemp + (i / numLabels) * (maxTemp - minTemp);
            ctx.fillText(temp.toFixed(2), x, 45);
        }
        container.appendChild(legendCanvas);
    }

    function calculateIceProbability(temperature, a, b) {
        return 1 / (1 + Math.exp(-(a + b * temperature)));
    }

    function draw2DIceProbabilityMap(surfaceData) {
        const iceProbabilityContainer = document.getElementById('2d-ice-probability-map');
        iceProbabilityContainer.innerHTML = '';
        const iceProbabilityInstance = h337.create({
            container: iceProbabilityContainer,
            radius: 90,
            maxOpacity: 0.8,
            minOpacity: 0.6,
            blur: 0.5,
            width: iceProbabilityContainer.offsetWidth,
            height: iceProbabilityContainer.offsetHeight,
            gradient: {
                0.0: 'blue',
                0.5: 'lightblue',
                1.0: 'white'
            }
        });

        const iceProbabilityData = surfaceData.map(point => ({
            x: (point.x / 9) * iceProbabilityContainer.offsetWidth,
            y: (point.y / 3) * iceProbabilityContainer.offsetHeight,
            value: calculateIceProbability(point.temperature, a, b)
        }));
        iceProbabilityInstance.setData({
            max: 1.0,
            min: 0.0,
            data: iceProbabilityData
        });

        drawIceProbabilityColorLegend(iceProbabilityContainer, 'absolute', '-60px', '10px', '冰概率（低）', '冰概率（高）');
    }

    function drawIceProbabilityColorLegend(container, position, bottom, left, leftLabel, rightLabel) {
        const legendWidth = 600;
        const legendHeight = 50;
        const legendCanvas = document.createElement('canvas');
        legendCanvas.width = legendWidth;
        legendCanvas.height = legendHeight;
        legendCanvas.style.position = position;
        legendCanvas.style.bottom = bottom;
        legendCanvas.style.left = left;
        const ctx = legendCanvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, legendWidth, 0);
        gradient.addColorStop(0.0, 'blue');
        gradient.addColorStop(0.5, 'lightblue')
        gradient.addColorStop(1, 'white');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 10, legendWidth, 20);

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(leftLabel, 48, 45);
        ctx.fillText(rightLabel, legendWidth-48, 45);

        container.appendChild(legendCanvas);
    }

    function drawPredictionChart(predictionData) {
        const ctx = document.getElementById('prediction-chart').getContext('2d');
        const labels = predictionData.map((_, index) => `${index + 1}h`);
        const minTempData = predictionData.map(data => data.minTemp);
        const meanTempData = predictionData.map(data => data.meanTemp);
        const iceProbabilityData = predictionData.map(data => calculateIceProbability(data.minTemp, a, b));
        const iceProbMin = Math.min(...iceProbabilityData);
        const iceProbMax = Math.max(...iceProbabilityData);

        if (predictionChart) {
            predictionChart.destroy();
        }

        predictionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Min Temperature',
                        data: minTempData,
                        borderColor: 'blue',
                        fill: false
                    },
                    {
                        label: 'Mean Temperature',
                        data: meanTempData,
                        borderColor: 'orange',
                        fill: false
                    },
                    {
                        label: 'Ice Probability',
                        data: iceProbabilityData,
                        borderColor: 'red',
                        fill: false,
                        yAxisID: 'iceProbability'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    iceProbability: {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Ice Probability'
                        },
                        min: iceProbMin,
                        max: iceProbMax
                    }
                }
            }
        });
    }

    function clearPredictionChart() {
        const ctx = document.getElementById('prediction-chart').getContext('2d');
        if (predictionChart) {
            predictionChart.destroy();
            predictionChart = null;
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    function displayWarningMessage(predictionData) {
        const warningMessageContainer = document.getElementById('warning-message');
        const iceProbabilityData = predictionData.map(data => calculateIceProbability(data.minTemp, a, b));
        const riskHour = iceProbabilityData.findIndex(prob => prob > 0.5);

        if (riskHour !== -1) {
            warningMessageContainer.textContent = `Warning: There is a freezing risk in ${riskHour + 1} hours.`;
        } else {
            warningMessageContainer.textContent = 'No freezing risk in the next 24 hours.';
        }
    }

    function clearWarningMessage() {
        const warningMessageContainer = document.getElementById('warning-message');
        warningMessageContainer.textContent = '';
    }

});
