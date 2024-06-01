import torch
import deepxde as dde
import numpy as np
import requests
import mysql.connector
from datetime import datetime

#看做一个整体
# 设置全局随机种子
seed = 123
np.random.seed(seed)
torch.manual_seed(seed)

def fetch_realtime_temperature():
    # 接口 URL 和 token
    url = "http://ynacce.yichiot.com:8013/TempeGwDatas/RealData"
    token = "hkSKgOQzlWUkYx5saUQlCcCIr9rudQBx"
    # 构造请求体
    body = {"token": token}
    # 发送 POST 请求
    response = requests.post(url, json=body)
    # 检查请求是否成功
    if response.status_code == 200:
        data = response.json()
        # 提取温度数据
        tempe_data = data.get("data", {}).get("tempe", [])
        humiture_data = data.get("data", {}).get("humiture", [])
        # 合并温度数据
        temperature_data = tempe_data + humiture_data
        # 提取温度值和设备编号，组成键值对形式
        realtime_temperature_data = {entry["code"]: entry["tempe"] for entry in temperature_data}
        points_values = [
            ([9, 3, 2.36], realtime_temperature_data['SMA-1']),
            ([9, 1.5, 2.36], realtime_temperature_data['SMA-3']),
            ([9, 0, 2.36], realtime_temperature_data['SMA-5']),
            ([6, 3, 2.36], realtime_temperature_data['SMA-11']),
            ([6, 0, 2.36], realtime_temperature_data['SMA-15']),
            ([3, 3, 2.36], realtime_temperature_data['SMA-21']),
            ([3, 0, 2.36], realtime_temperature_data['SMA-25']),
            ([0, 3, 2.36], realtime_temperature_data['SMA-31']),
            ([0, 1.5, 2.36], realtime_temperature_data['SMA-33']),
            ([0, 0, 2.36], realtime_temperature_data['SMA-35']),

            ([9, 0, 2.30], realtime_temperature_data['AC-1']),
            ([9, 1.5, 2.30], realtime_temperature_data['AC-2']),
            ([9, 3, 2.30], realtime_temperature_data['AC-3']),
            ([6, 3, 2.30], realtime_temperature_data['AC-4']),
            ([6, 1.5, 2.30], realtime_temperature_data['AC-5']),
            ([6, 0, 2.30], realtime_temperature_data['AC-6']),
            ([3, 0, 2.30], realtime_temperature_data['AC-7']),
            ([3, 1.5, 2.30], realtime_temperature_data['AC-8']),
            ([3, 3, 2.30], realtime_temperature_data['AC-9']),
            ([0, 3, 2.30], realtime_temperature_data['AC-10']),

            ([0, 0, 2.22], realtime_temperature_data['49']),
            ([0, 1.5, 2.22], realtime_temperature_data['50']),
            ([0, 3, 2.22], realtime_temperature_data['51']),
            ([3, 3, 2.22], realtime_temperature_data['52']),
            ([3, 1.5, 2.22], realtime_temperature_data['53']),
            ([3, 0, 2.22], realtime_temperature_data['54']),
            ([6, 0, 2.22], realtime_temperature_data['55']),
            ([6, 1.5, 2.22], realtime_temperature_data['56']),
            ([6, 3, 2.22], realtime_temperature_data['57']),
            ([9, 3, 2.22], realtime_temperature_data['58']),
            ([9, 1.5, 2.22], realtime_temperature_data['59']),
            ([9, 0, 2.22], realtime_temperature_data['60']),

            ([9, 0, 1.86], realtime_temperature_data['24']),

            ([9, 0, 1.68], realtime_temperature_data['48']),

            ([0, 3, 1.00], realtime_temperature_data['27']),
            ([3, 3, 1.00], realtime_temperature_data['28']),
            ([3, 0, 1.00], realtime_temperature_data['30']),
            ([6, 0, 1.00], realtime_temperature_data['31']),
            ([6, 1.5, 1.00], realtime_temperature_data['32']),
            ([6, 3, 1.00], realtime_temperature_data['33']),
            ([9, 3, 1.00], realtime_temperature_data['34']),
            ([9, 1.5, 1.00], realtime_temperature_data['35']),
            ([9, 0, 1.00], realtime_temperature_data['36']),

            ([0, 1.5, 0.20], realtime_temperature_data['62']),
            ([0, 3, 0.20], realtime_temperature_data['63']),
            ([3, 3, 0.20], realtime_temperature_data['64']),
            ([3, 1.5, 0.20], realtime_temperature_data['65']),
            ([6, 3, 0.20], realtime_temperature_data['69']),
            ([9, 3, 0.20], realtime_temperature_data['70']),
            ([9, 1.5, 0.20], realtime_temperature_data['71']),
            ([9, 0, 0.20], realtime_temperature_data['72']),
        ]
        return points_values
    else:
        print("Failed to fetch realtime temperature data.")
        return []

def heat_equation_3d(x, u):
    du_xx = dde.grad.hessian(u, x, i=0, j=0)
    du_yy = dde.grad.hessian(u, x, i=1, j=1)
    du_zz = dde.grad.hessian(u, x, i=2, j=2)
    return (du_xx + du_yy + du_zz)



geom = dde.geometry.Cuboid([0, 0, 0], [9, 3, 2.4])
points_values = fetch_realtime_temperature()
boundary_conditions = []

for point, value in points_values:
    point_set_bc = dde.PointSetBC(points=point, values=value)
    boundary_conditions.append(point_set_bc)


# 创建数据对象
data = dde.data.PDE(
    geom,
    heat_equation_3d,
    boundary_conditions,
    train_distribution="pseudo",
    num_domain=20000,  # 根据需要设置数据点的数量
    num_test=500,
    num_boundary=51,

)

net = dde.nn.FNN([3] + [20] * 5 + [1], "tanh", "Glorot normal")
model = dde.Model(data, net)
pde_resampler = dde.callbacks.PDEPointResampler(period=10)
model.compile("adam", lr=1e-3)
losshistory, train_state = model.train(iterations=20000, callbacks=[pde_resampler])

# 使用模型进行预测
x = np.linspace(0, 9, 30)
y = np.linspace(0, 3, 10)
z = np.linspace(0, 2.4, 8)
X, Y, Z = np.meshgrid(x, y, z)
X = X.ravel()
Y = Y.ravel()
Z = Z.ravel()
input_tensor = np.column_stack([X,Y,Z])
temperature_prediction = model.predict(input_tensor)

#保存所有的预测值
data_array = np.column_stack((X, Y, Z, temperature_prediction))
# 保存为 CSV 文件
np.savetxt(f"prev_3d.csv", data_array, delimiter=",", header="x,y,z,temperature", comments="")

# 提取并保存表面温度数据（假设 z = 2.4 为表面）
surface_indices = np.where(Z == 2.4)
surface_data = data_array[surface_indices]
surface_data_xy_temp = surface_data[:, [0, 1, 3]]  # 仅选择 x, y 和 temperature 列
np.savetxt(f"prev_surface.csv", surface_data_xy_temp, delimiter=",", header="x,y,temperature", comments="")

# 数据库连接配置
db_config = {
    'user': 'root',
    'password': 'Zyy200404181109!',
    'host': '39.101.70.247',
    'database': 'my_database'
}

# 创建新表
def create_table(cursor, table_name):
    create_query = (
        f"CREATE TABLE IF NOT EXISTS {table_name} ("
        "  id INT AUTO_INCREMENT PRIMARY KEY,"
        "  x FLOAT,"
        "  y FLOAT,"
        "  z FLOAT,"
        "  temperature FLOAT"
        ")"
    )
    cursor.execute(create_query)

# 将数据存入数据库
def store_data_to_db(data_array):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # 获取当前时间作为表名
        current_time = datetime.now().strftime('%Y_%m_%d_%H')
        table_name = f"temperature_data_{current_time}"

        # 创建新表
        create_table(cursor, table_name)

        # 将数据插入新表
        for row in data_array:
            x, y, z, temperature = row
            insert_query = f"INSERT INTO {table_name} (x, y, z, temperature) VALUES (%s, %s, %s, %s)"
            cursor.execute(insert_query, (x, y, z, temperature))

        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        cursor.close()
        conn.close()

store_data_to_db(data_array)
