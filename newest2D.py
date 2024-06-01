import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import deepxde as dde
from sklearn.linear_model import LogisticRegression
import torch
import time

#看做一个整体
# 设置全局随机种子
seed = 123
np.random.seed(seed)
torch.manual_seed(seed)

def load_data(file_path):
    dtime = np.loadtxt(file_path, delimiter=',',skiprows=1, usecols=range(0,1),dtype=str)
    temp_SMA16 = np.loadtxt(file_path, delimiter=',', skiprows=1, usecols=range(135, 170))
    temp_AC20 = np.loadtxt(file_path, delimiter=',', skiprows=1, usecols=range(170, 180))
    temp_ATB25 = np.loadtxt(file_path, delimiter=',', skiprows=1, usecols=range(55, 55 + 12))
    temp_54 = np.loadtxt(file_path, delimiter=',', skiprows=1, usecols=range(30, 31)).reshape(-1,1)
    temp_72 = np.loadtxt(file_path, delimiter=',', skiprows=1, usecols=range(54, 55)).reshape(-1,1)
    temp_140 = np.loadtxt(file_path, delimiter=',',skiprows=1, usecols=range(32,32+11))  # 温度数据
    temp_220 = np.loadtxt(file_path, delimiter=',', skiprows=1, usecols=range(67, 67 + 12))  # 温度数据
    return  dtime,temp_SMA16,temp_AC20,temp_ATB25,temp_54,temp_72,temp_140,temp_220
def heat_equation_3d(x, u):
    du_xx = dde.grad.hessian(u, x, i=0, j=0)
    du_yy = dde.grad.hessian(u, x, i=1, j=1)
    du_zz = dde.grad.hessian(u, x, i=2, j=2)
    return (du_xx + du_yy + du_zz)

file_path = 'C:\\Users\\86186\\Desktop\\2\\DataRcd_20240301.csv' #修改训练文件
dtime,temp_SMA16,temp_AC20,temp_ATB25,temp_54,temp_72,temp_140,temp_220 = load_data(file_path)
print(temp_54.shape)

geom = dde.geometry.Cuboid([0, 0, 0], [9, 3, 2.4])

points_values = [
    ([9, 3, 236], temp_SMA16[0][0]),
    ([9, 1.5, 236], temp_SMA16[0][2]),
    ([9, 0, 236], temp_SMA16[0][4]),
    ([6, 3, 236], temp_SMA16[0][10]),
    ([6, 0, 236], temp_SMA16[0][14]),
    ([3, 3, 236], temp_SMA16[0][20]),
    ([3, 0, 236], temp_SMA16[0][24]),
    ([0, 3, 236], temp_SMA16[0][30]),
    ([0, 1.5, 236], temp_SMA16[0][32]),
    ([0, 0, 236], temp_SMA16[0][34]),

    ([9, 0, 230], temp_AC20[0][0]),
    ([9, 1.5, 230], temp_AC20[0][1]),
    ([9, 3, 230], temp_AC20[0][2]),
    ([6, 3, 230], temp_AC20[0][3]),
    ([6, 1.5, 230], temp_AC20[0][4]),
    ([6, 0, 230], temp_AC20[0][5]),
    ([3, 0, 230], temp_AC20[0][6]),
    ([3, 1.5, 230], temp_AC20[0][7]),
    ([3, 3, 230], temp_AC20[0][8]),
    ([0, 3, 230], temp_AC20[0][9]),

    ([0, 0, 222], temp_ATB25[0][0]),
    ([0, 1.5, 222], temp_ATB25[0][1]),
    ([0, 3, 222], temp_ATB25[0][2]),
    ([3, 3, 222], temp_ATB25[0][3]),
    ([3, 1.5, 222], temp_ATB25[0][4]),
    ([3, 0, 222], temp_ATB25[0][5]),
    ([6, 0, 222], temp_ATB25[0][6]),
    ([6, 1.5, 222], temp_ATB25[0][7]),
    ([6, 3, 222], temp_ATB25[0][8]),
    ([9, 3, 222], temp_ATB25[0][9]),
    ([9, 1.5, 222], temp_ATB25[0][10]),
    ([9, 0, 222], temp_ATB25[0][11]),

    ([9, 0, 186], temp_54[0][0]),

    ([9, 0, 168], temp_72[0][0]),

    ([0, 1.5, 100], temp_140[0][0]),
    ([0, 3, 100], temp_140[0][1]),
    ([3, 3, 100], temp_140[0][2]),
    ([3, 0, 100], temp_140[0][4]),
    ([6, 0, 100], temp_140[0][5]),
    ([6, 1.5, 100], temp_140[0][6]),
    ([6, 3, 100], temp_140[0][7]),
    ([9, 3, 100], temp_140[0][8]),
    ([9, 1.5, 100], temp_140[0][9]),
    ([9, 0, 100], temp_140[0][10]),

    ([0, 0, 20], temp_220[0][0]),
    ([0, 1.5, 20], temp_220[0][1]),
    ([0, 3, 20], temp_220[0][2]),
    ([3, 3, 20], temp_220[0][3]),
    ([3, 1.5, 20], temp_220[0][4]),
    ([6, 0, 20], temp_220[0][6]),
    ([6, 3, 20], temp_220[0][8]),
    ([9, 3, 20], temp_220[0][9]),
    ([9, 1.5, 20], temp_220[0][10]),
    ([9, 0, 20], temp_220[0][11]),

]

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
    num_domain=1000,  # 根据需要设置数据点的数量
    num_test=500,
    num_boundary=54,

)


net = dde.nn.FNN([3] + [20] * 5 + [1], "tanh", "Glorot normal")
model = dde.Model(data, net)
pde_resampler = dde.callbacks.PDEPointResampler(period=10)
model.compile("adam", lr=1e-3)
losshistory, train_state = model.train(iterations=1000, callbacks=[pde_resampler])
model.save(save_path="./model") 

# 使用模型进行预测
x = np.linspace(0, 9, 100)
y = np.linspace(0, 3, 100)
z = np.linspace(0, 2.4, 100)
X, Y, Z = np.meshgrid(x, y, z)
X = X.ravel()
Y = Y.ravel()
Z = Z.ravel()
input_tensor = np.column_stack([X,Y,Z])
temperature_prediction = model.predict(input_tensor)

# 计算结冰概率
threshold = 0.5
ice_probability = 1 / (1 + np.exp(-temperature_prediction))

# 使用Logistic回归模型映射到0-1之间的概率值
def logistic_regression(x):
    return 1 / (1 + np.exp(-x))

ice_probability_logistic = logistic_regression(ice_probability)

# 标记结冰区域
ice_region = temperature_prediction.copy()
ice_region[ice_probability_logistic < 0.5] = np.nan

# 生成特定Z坐标的2D冰概率地图
Z_value = 0
Z_index = np.argmin(np.abs(Z - Z_value))  # 寻找与表面最接近的索引
ice_probability_slice = ice_probability[Z_index::100]
ice_probability_grid = ice_probability_slice.reshape(100, 100)

# 创建颜色映射蓝白
from matplotlib.colors import LinearSegmentedColormap

cdict = {'red':   [(0.0, 0.0, 0.0),
                   (1.0, 1.0, 1.0)],

         'green': [(0.0, 0.0, 0.0),
                   (1.0, 1.0, 1.0)],

         'blue':  [(0.0, 1.0, 1.0),
                   (1.0, 1.0, 1.0)]}

custom_cmap = LinearSegmentedColormap('blue_white', cdict)

# 生成2D冰概率地图时使用自定义的颜色映射
plt.figure()
plt.imshow(ice_probability_grid, cmap=custom_cmap, extent=(0, 9, 0, 3), origin='lower')
plt.colorbar()
plt.xlabel('X')
plt.ylabel('Y')
plt.title("2D heat map of probability of icing at road surface")
plt.savefig('ice_probability_2D.png')
plt.show()