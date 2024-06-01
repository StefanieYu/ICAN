import { OrbitControls } from './module/OrbitControls.js';
import * as THREE from './module/three.module.min.js';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.addEventListener("DOMContentLoaded", function() {

    // 创建场景、相机和渲染器
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene.background = new THREE.Color(0xffffff);
    camera.up.set(0, 0, 1);
    document.body.appendChild(renderer.domElement);

    // 添加控件
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 启用阻尼（惯性）
    controls.dampingFactor = 0.25; // 阻尼系数
    controls.update();

    // 相机位置
    camera.position.set(4.5, -5, 5);
    const lookAtPosition = new THREE.Vector3(4.5, 1.5, 3); // 设置相机观察的目标位置，这里设置为场景中心点
    camera.lookAt(lookAtPosition);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);


    // 创建路面模型
    const roadWidth = 3; // 路面宽度
    const roadLength = 9; // 路面长度

    const layerMeshes = [];

    const layers = [
        { height: 2.36, material: { thickness: 0.04, color: 0x66cdaa }, name: 'SMA-16' }, // 上面层
        { height: 2.30, material: { thickness: 0.06, color: 0xeee9e9 }, name: 'AC-20C' }, // 中面层
        { height: 2.22, material: { thickness: 0.08, color: 0xcd2626 }, name: 'ATB-25' }, // 下面层
        { height: 1.86, material: { thickness: 0.36, color: 0x1e90ff }, name: '水泥稳定碎石基层' }, // 基层
        { height: 1.68, material: { thickness: 0.18, color: 0xeee9e9 }, name: '二灰稳定碎石基层' }, // 下基层
        { height: 0, material: { thickness: 1.68, color: 0xcdaa7d }, name: '土基' } // 土基
    ];

    layers.forEach((layer, index)=> {
        const geometry = new THREE.BoxGeometry(roadLength, roadWidth, layer.material.thickness);
        const material = new THREE.MeshLambertMaterial({ 
            color: layer.material.color, 
            side: THREE.DoubleSide // 使用双面材质
        });
        const mesh = new THREE.Mesh(geometry, material);
        const initialPosition = layer.height + layer.material.thickness / 2;
        const separatedPosition = initialPosition + (6 - index) * 0.5;
        mesh.userData = { initialPosition, separatedPosition };
        mesh.position.set(4.5, 1.5, mesh.userData.initialPosition); // 设置几何体中心位置
        mesh.renderOrder = 1; // 设置渲染顺序
        scene.add(mesh);
        layerMeshes.push(mesh);

        // 绑定传感器到面层
        if (layer.name === 'SMA-16') {
            const smaSensors = [
                { code: '103', position: new THREE.Vector3(-4.5, -1, 0.02) },
                { code: '104', position: new THREE.Vector3(-2.25, -1, 0.02) },
                { code: '105', position: new THREE.Vector3(0, -1, 0.02) },
                { code: '106', position: new THREE.Vector3(2.25, -1, 0.02) },
                { code: '107', position: new THREE.Vector3(4.5, -1, 0.02) },
                { code: '83', position: new THREE.Vector3(-4.5, -1, 0.3) },
                { code: '84', position: new THREE.Vector3(-2.25, -1, 0.3) },
                { code: '85', position: new THREE.Vector3(0, -1, 0.3) },
                { code: '86', position: new THREE.Vector3(2.25, -1, 0.3) },
                { code: '87', position: new THREE.Vector3(4.5, -1, 0.3) },
                { code: '88', position: new THREE.Vector3(-4.5, 1, 0.3) },
                { code: '89', position: new THREE.Vector3(-2.25, 1, 0.3) },
                { code: '90', position: new THREE.Vector3(0, 1, 0.3) },
                { code: '91', position: new THREE.Vector3(2.25, 1, 0.3) },
                { code: '92', position: new THREE.Vector3(4.5, 1, 0.3) },
                { code: 'SMA-1', position: new THREE.Vector3(4.5, 1.5, -0.02) },
                { code: 'SMA-2', position: new THREE.Vector3(4.5, 0.75, -0.02) },
                { code: 'SMA-3', position: new THREE.Vector3(4.5, 0, -0.02) },
                { code: 'SMA-4', position: new THREE.Vector3(4.5, -0.75, -0.02) },
                { code: 'SMA-5', position: new THREE.Vector3(4.5, -1.5, -0.02) },
                { code: 'SMA-6', position: new THREE.Vector3(3, 1.5, -0.02) },
                { code: 'SMA-7', position: new THREE.Vector3(3, 0.75, -0.02) },
                { code: 'SMA-8', position: new THREE.Vector3(3, 0, -0.02) },
                { code: 'SMA-9', position: new THREE.Vector3(3, -0.75, -0.02) },
                { code: 'SMA-10', position: new THREE.Vector3(3, -1.5, -0.02) },
                { code: 'SMA-11', position: new THREE.Vector3(1.5, 1.5, -0.02) },
                { code: 'SMA-12', position: new THREE.Vector3(1.5, 0.75, -0.02) },
                { code: 'SMA-13', position: new THREE.Vector3(1.5, 0, -0.02) },
                { code: 'SMA-14', position: new THREE.Vector3(1.5, -0.75, -0.02) },
                { code: 'SMA-15', position: new THREE.Vector3(1.5, -1.5, -0.02) },
                { code: 'SMA-16', position: new THREE.Vector3(0, 1.5, -0.02) },
                { code: 'SMA-17', position: new THREE.Vector3(0, 0.75, -0.02) },
                { code: 'SMA-18', position: new THREE.Vector3(0, 0, -0.02) },
                { code: 'SMA-19', position: new THREE.Vector3(0, -0.75, -0.02) },
                { code: 'SMA-20', position: new THREE.Vector3(0, -1.5, -0.02) },
                { code: 'SMA-21', position: new THREE.Vector3(-1.5, 1.5, -0.02) },
                { code: 'SMA-22', position: new THREE.Vector3(-1.5, 0.75, -0.02) },
                { code: 'SMA-23', position: new THREE.Vector3(-1.5, 0, -0.02) },
                { code: 'SMA-24', position: new THREE.Vector3(-1.5, -0.75, -0.02) },
                { code: 'SMA-25', position: new THREE.Vector3(-1.5, -1.5, -0.02) },
                { code: 'SMA-26', position: new THREE.Vector3(-3, 1.5, -0.02) },
                { code: 'SMA-27', position: new THREE.Vector3(-3, 0.75, -0.02) },
                { code: 'SMA-28', position: new THREE.Vector3(-3, 0, -0.02) },
                { code: 'SMA-29', position: new THREE.Vector3(-3, -0.75, -0.02) },
                { code: 'SMA-30', position: new THREE.Vector3(-3, -1.5, -0.02) },
                { code: 'SMA-31', position: new THREE.Vector3(-4.5, 1.5, -0.02) },
                { code: 'SMA-32', position: new THREE.Vector3(-4.5, 0.75, -0.02) },
                { code: 'SMA-33', position: new THREE.Vector3(-4.5, 0, -0.02) },
                { code: 'SMA-34', position: new THREE.Vector3(-4.5, -0.75, -0.02) },
                { code: 'SMA-35', position: new THREE.Vector3(-4.5, -1.5, -0.02) }
            ];
            smaSensors.forEach(sensor => {
                const sensorMesh = addSensor(sensor.code, sensor.position, 0xff0000);
                mesh.add(sensorMesh); // 将传感器添加到 mesh 中
            });
        }
        // 添加其他层的传感器 (例如 AC-20C)
        else if (layer.name === 'AC-20C') {
            const acSensors = [
                { code: 'AC-1', position: new THREE.Vector3(4.5, 1.5, -0.03) }, 
                { code: 'AC-2', position: new THREE.Vector3(4.5, 0, -0.03) },
                { code: 'AC-3', position: new THREE.Vector3(4.5, -1.5, -0.03) },
                { code: 'AC-4', position: new THREE.Vector3(1.5, 1.5, -0.03) },
                { code: 'AC-5', position: new THREE.Vector3(1.5, 0, -0.03) },
                { code: 'AC-6', position: new THREE.Vector3(1.5, -1.5, -0.03) },
                { code: 'AC-7', position: new THREE.Vector3(-1.5, 1.5, -0.03) },
                { code: 'AC-8', position: new THREE.Vector3(-1.5, 0, -0.03) },
                { code: 'AC-9', position: new THREE.Vector3(-1.5, -1.5, -0.03) },
                { code: 'AC-10', position: new THREE.Vector3(-4.5, 1.5, -0.03) },
                { code: 'AC-11', position: new THREE.Vector3(-4.5, 0, -0.03) },
                { code: 'AC-12', position: new THREE.Vector3(-4.5, -1.5, -0.03) }
            ];
            acSensors.forEach(sensor => {
                const sensorMesh = addSensor(sensor.code, sensor.position, 0xff0000);
                mesh.add(sensorMesh); // 将传感器添加到 mesh 中
            });
        }
        else if (layer.name === 'ATB-25') {
            const atbSensors = [
                { code: '58', position: new THREE.Vector3(4.5, 1.5, -0.04) }, 
                { code: '59', position: new THREE.Vector3(4.5, 0, -0.04) },
                { code: '60', position: new THREE.Vector3(4.5, -1.5, -0.04) },
                { code: '57', position: new THREE.Vector3(1.5, 1.5, -0.04) },
                { code: '56', position: new THREE.Vector3(1.5, 0, -0.04) },
                { code: '55', position: new THREE.Vector3(1.5, -1.5, -0.04) },
                { code: '52', position: new THREE.Vector3(-1.5, 1.5, -0.04) },
                { code: '53', position: new THREE.Vector3(-1.5, 0, -0.04) },
                { code: '54', position: new THREE.Vector3(-1.5, -1.5, -0.04) },
                { code: '51', position: new THREE.Vector3(-4.5, 1.5, -0.04) },
                { code: '50', position: new THREE.Vector3(-4.5, 0, -0.04) },
                { code: '49', position: new THREE.Vector3(-4.5, -1.5, -0.04) }
            ];
            atbSensors.forEach(sensor => {
                const sensorMesh = addSensor(sensor.code, sensor.position, 0xff0000);
                mesh.add(sensorMesh); // 将传感器添加到 mesh 中
            });
        }
        else if (layer.name === '水泥稳定碎石基层') {
            const wtSensors = [
                { code: '24', position: new THREE.Vector3(4.5, -1.5, -0.18) }, 
            ];
            wtSensors.forEach(sensor => {
                const sensorMesh = addSensor(sensor.code, sensor.position, 0xff0000);
                mesh.add(sensorMesh); // 将传感器添加到 mesh 中
            });
        }
        else if (layer.name === '二灰稳定碎石基层') {
            const twSensors = [
                { code: '48', position: new THREE.Vector3(4.5, -1.5, -0.09) }, 
            ];
            twSensors.forEach(sensor => {
                const sensorMesh = addSensor(sensor.code, sensor.position, 0xff0000);
                mesh.add(sensorMesh); // 将传感器添加到 mesh 中
            });
        }
        else if (layer.name === '土基') {
            const soSensors = [
                { code: '34', position: new THREE.Vector3(4.5, 1.5, 0.16) }, 
                { code: '35', position: new THREE.Vector3(4.5, 0, 0.16) },
                { code: '36', position: new THREE.Vector3(4.5, -1.5, 0.16) },
                { code: '33', position: new THREE.Vector3(1.5, 1.5, 0.16) },
                { code: '32', position: new THREE.Vector3(1.5, 0, 0.16) },
                { code: '31', position: new THREE.Vector3(1.5, -1.5, 0.16) },
                { code: '28', position: new THREE.Vector3(-1.5, 1.5, 0.16) },
                { code: '29', position: new THREE.Vector3(-1.5, 0, 0.16) },
                { code: '30', position: new THREE.Vector3(-1.5, -1.5, 0.16) },
                { code: '27', position: new THREE.Vector3(-4.5, 1.5, 0.16) },
                { code: '26', position: new THREE.Vector3(-4.5, 0, 0.16) },
                { code: '25', position: new THREE.Vector3(-4.5, -1.5, 0.16)},
                { code: '70', position: new THREE.Vector3(4.5, 1.5, -0.64) }, 
                { code: '71', position: new THREE.Vector3(4.5, 0, -0.64) },
                { code: '72', position: new THREE.Vector3(4.5, -1.5, -0.64) },
                { code: '69', position: new THREE.Vector3(1.5, 1.5, -0.64) },
                { code: '68', position: new THREE.Vector3(1.5, 0, -0.64) },
                { code: '67', position: new THREE.Vector3(1.5, -1.5, -0.64) },
                { code: '64', position: new THREE.Vector3(-1.5, 1.5, -0.64) },
                { code: '65', position: new THREE.Vector3(-1.5, 0, -0.64) },
                { code: '66', position: new THREE.Vector3(-1.5, -1.5, -0.64) },
                { code: '63', position: new THREE.Vector3(-4.5, 1.5, -0.64) },
                { code: '62', position: new THREE.Vector3(-4.5, 0, -0.64) },
                { code: '61', position: new THREE.Vector3(-4.5, -1.5, -0.64)}
            ];
            soSensors.forEach(sensor => {
                const sensorMesh = addSensor(sensor.code, sensor.position, 0xff0000);
                mesh.add(sensorMesh); // 将传感器添加到 mesh 中
            });
        }

    });

    // 添加传感器
    function addSensor(code, position, color) {
        const geometry = new THREE.SphereGeometry(0.05, 10, 10);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const sensor = new THREE.Mesh(geometry, material);
        sensor.userData = { code: code, temperature: 0 };
        sensor.position.copy(position);
        return sensor;
    }

    // 加载温度数据并更新传感器
    async function updateTemperatureData() {
        try {
            const response = await fetch('http://ynacce.yichiot.com:8013/TempeGwDatas/RealData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: 'hkSKgOQzlWUkYx5saUQlCcCIr9rudQBx' })
            });

            const data = await response.json();
            const temperatures = data.data.tempe;
            const humitures = data.data.humiture;
            temperatures.forEach(temp => {
                // 查找所有传感器并更新温度
                layerMeshes.forEach(mesh => {
                    mesh.children.forEach(sensor => {
                        if (sensor.userData.code === temp.code) {
                            sensor.userData.temperature = temp.tempe;
                            sensor.material.color.setHex(0x0000ff);
                        }
                    });
                });
            });
            humitures.forEach(humiture => {
                layerMeshes.forEach(mesh => {
                    mesh.children.forEach(sensor => {
                        if(sensor.userData.code === humiture.code){
                            sensor.userData.temperature = humiture.tempe;
                            sensor.material.color.setHex(0x0000ff);
                        }
                    })
                })
            })
        } catch (error) {
            console.error('Error updating temperature data:', error);
        }
    }

    // 设置定时更新
    setInterval(updateTemperatureData, 3000); // 每秒更新一次

    let infoLabelTimeout;

    function onMouseClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        // 只检测传感器，忽略路面对象
        const allSensors = [];
        layerMeshes.forEach(layer => {
            layer.traverse(child => {
                if (child.userData && child.userData.code) {
                    allSensors.push(child);
                }
            });
        });
        const intersects = raycaster.intersectObjects(allSensors);
        if (intersects.length > 0) {
            const selectedSensor = intersects[0].object;
            if (selectedSensor.userData.code) {
                const sensorCode = selectedSensor.userData.code;
                const temperature = selectedSensor.userData.temperature;

                const infoContainer = document.getElementById('info-container');
                let infoLabel = document.querySelector('.info-label');
                if (!infoLabel) {
                    infoLabel = document.createElement('div');
                    infoLabel.className = 'info-label';
                    infoContainer.appendChild(infoLabel);
                }
                infoLabel.innerHTML = `<span class="sensor-code">Sensor Code: ${sensorCode}</span><span class="temperature">Temperature: ${temperature}°C</span>`;

                // 使用renderer.domElement.getBoundingClientRect()来确保位置正确
                const rect = renderer.domElement.getBoundingClientRect();
                infoLabel.style.left = `${event.clientX - rect.left}px`;
                infoLabel.style.top = `${event.clientY - rect.top}px`;
                // 清除之前的定时器
                clearTimeout(infoLabelTimeout);

                // 设置新的定时器，让标签在一段时间后消失
                infoLabelTimeout = setTimeout(() => {
                    infoLabel.remove();
                }, 3000); // 3秒后消失
            }
        }
    }

    window.addEventListener('click', onMouseClick, false);

    // 双击事件处理
    let layersSeparated = false;
    let singleLayerVisible = null;

    function onDoubleClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        // 只检测传感器，忽略路面对象
        const allSensors = [];
        layerMeshes.forEach(layer => {
            layer.traverse(child => {
                if (child.userData && child.userData.code) {
                    allSensors.push(child);
                }
            });
        });
        const intersects = raycaster.intersectObjects(layerMeshes);

        if (singleLayerVisible !== null) {
            // 当前显示单层时双击，恢复分离状态
            singleLayerVisible.material.transparent = false; // 取消透明效果
            singleLayerVisible.material.opacity = 1;
            singleLayerVisible = null;
            layersSeparated = true; // 恢复到分离状态
            layerMeshes.forEach(mesh => {
                mesh.visible = true;
                const targetPosition = mesh.userData.separatedPosition;
                mesh.position.set(4.5, 1.5, targetPosition);
            });
        } else if (layersSeparated) {
            // 分离状态下双击某一层单独显示该层
            if (intersects.length > 0) {
                singleLayerVisible = intersects[0].object;
                layerMeshes.forEach(mesh => {
                    mesh.visible = mesh === singleLayerVisible;
                });
                singleLayerVisible.position.set(4.5, 1.5, singleLayerVisible.userData.initialPosition);
                // 将单层加载到屏幕中间
                camera.position.set(4.5, -5, singleLayerVisible.userData.initialPosition + 5);
                camera.lookAt(new THREE.Vector3(4.5, 1.5, singleLayerVisible.userData.initialPosition));
                // 设置单层透明效果
                singleLayerVisible.material.transparent = true;
                singleLayerVisible.material.opacity = 0.5;
            } else {
                // 双击空白部分，恢复到各层重合状态
                layersSeparated = false;
                layerMeshes.forEach(mesh => {
                    const targetPosition = mesh.userData.initialPosition;
                    mesh.position.set(4.5, 1.5, targetPosition);
                });
            }
        } else {
            // 双击空白部分分离各层
            layersSeparated = true;
            layerMeshes.forEach(mesh => {
                const targetPosition = mesh.userData.separatedPosition;
                mesh.position.set(4.5, 1.5, targetPosition);
            });
        }
    }


    window.addEventListener('dblclick', onDoubleClick, false);

    // 加载路面颜色和层名称
    const roadLayers = [
        { name: 'SMA-16', color: '#66cdaa' },
        { name: 'AC-20C', color: '#eee9e9' },
        { name: 'ATB-25', color: '#cd2626' },
        { name: '水泥稳定碎石基层', color: '#1e90ff' },
        { name: '二灰稳定碎石基层', color: '#eee9e9' },
        { name: '土基', color: '#cdaa7d' }
    ];

    const legendContainer = document.createElement('div');
    legendContainer.classList.add('legend-container');

    roadLayers.forEach(layer => {
        const layerLegend = document.createElement('div');
        layerLegend.classList.add('layer-legend');
        layerLegend.style.backgroundColor = layer.color;
        layerLegend.innerHTML = `<span class="layer-name">${layer.name}</span>`;
        legendContainer.appendChild(layerLegend);
    });

    document.body.appendChild(legendContainer);


    // 更新动画函数
    function animate() {
        requestAnimationFrame(animate);
        controls.target.copy(lookAtPosition);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
});
