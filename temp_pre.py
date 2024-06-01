import numpy as np
import mysql.connector
import torch
import torch.nn as nn
import torch.optim as optim
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler

# 数据库连接配置
db_config = {
    'user': 'root',
    'password': 'Zyy200404181109!',
    'host': '39.101.70.247',
    'database': 'my_database'
}

# 获取过去48小时的表面温度数据
def fetch_past_temperature_data(hours=48):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        start_time_str = start_time.strftime('%Y_%m_%d_%H')
        end_time_str = end_time.strftime('%Y_%m_%d_%H')
        
        # 获取过去48小时内的所有相关表名
        cursor.execute("SHOW TABLES")
        all_tables = cursor.fetchall()
        table_names = []
        for table in all_tables:
            table_name = table[0]
            if table_name.startswith('temperature_data_'):
                table_time_str = table_name.split('temperature_data_')[1]
                if start_time_str <= table_time_str <= end_time_str:
                    table_names.append(table_name)
        
        result = []
        for table_name in table_names:
            query = f"SELECT x, y, temperature FROM {table_name} WHERE ABS(z - 2.4) < 0.01"
            cursor.execute(query)
            table_data = cursor.fetchall()
            result.extend(table_data)
        
        return result
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return []
    finally:
        cursor.close()
        conn.close()

# 准备训练数据
past_data = fetch_past_temperature_data()
past_data = np.array(past_data)

if past_data.size == 0:
    raise ValueError("No data retrieved from the database.")

# 获取时间点的温度最小值和平均值
timestamps = np.unique(past_data[:, 0])
min_temps = []
mean_temps = []

for timestamp in timestamps:
    temp_data = past_data[past_data[:, 0] == timestamp][:, 2]
    min_temps.append(np.min(temp_data))
    mean_temps.append(np.mean(temp_data))

# 转换为numpy数组
min_temps = np.array(min_temps)
mean_temps = np.array(mean_temps)

# 归一化数据
scaler_min = MinMaxScaler()
scaler_mean = MinMaxScaler()
min_temps_scaled = scaler_min.fit_transform(min_temps.reshape(-1, 1)).flatten()
mean_temps_scaled = scaler_mean.fit_transform(mean_temps.reshape(-1, 1)).flatten()

# 创建时间序列
seq_length = 24  # 24小时的时间窗口
def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        x = data[i:i+seq_length]
        y = data[i+seq_length]
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)

X_min_seq, y_min_seq = create_sequences(min_temps_scaled, seq_length)
X_mean_seq, y_mean_seq = create_sequences(mean_temps_scaled, seq_length)

# 转换为PyTorch张量并调整形状
X_min_seq = torch.tensor(X_min_seq, dtype=torch.float32).unsqueeze(-1)
y_min_seq = torch.tensor(y_min_seq, dtype=torch.float32).unsqueeze(-1)
X_mean_seq = torch.tensor(X_mean_seq, dtype=torch.float32).unsqueeze(-1)
y_mean_seq = torch.tensor(y_mean_seq, dtype=torch.float32).unsqueeze(-1)

# 构建LSTM模型
class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_layer_size, output_size, num_layers=1):
        super(LSTMModel, self).__init__()
        self.hidden_layer_size = hidden_layer_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_layer_size, num_layers, batch_first=True)
        self.linear = nn.Linear(hidden_layer_size, output_size)
        self.hidden_cell = None

    def forward(self, input_seq):
        lstm_out, self.hidden_cell = self.lstm(input_seq, self.hidden_cell)
        predictions = self.linear(lstm_out[:, -1, :])
        return predictions

input_size = 1
hidden_layer_size = 50
output_size = 1

model_min = LSTMModel(input_size, hidden_layer_size, output_size)
model_mean = LSTMModel(input_size, hidden_layer_size, output_size)

loss_function = nn.MSELoss()
optimizer_min = optim.Adam(model_min.parameters(), lr=0.001)
optimizer_mean = optim.Adam(model_mean.parameters(), lr=0.001)

# 训练模型
epochs = 150
for i in range(epochs):
    for seq, labels in zip(X_min_seq, y_min_seq):
        optimizer_min.zero_grad()
        model_min.hidden_cell = (torch.zeros(model_min.num_layers, 1, model_min.hidden_layer_size),
                                 torch.zeros(model_min.num_layers, 1, model_min.hidden_layer_size))
        y_pred = model_min(seq.unsqueeze(0))
        single_loss = loss_function(y_pred, labels.view(1, 1))
        single_loss.backward()
        optimizer_min.step()
    
    for seq, labels in zip(X_mean_seq, y_mean_seq):
        optimizer_mean.zero_grad()
        model_mean.hidden_cell = (torch.zeros(model_mean.num_layers, 1, model_mean.hidden_layer_size),
                                  torch.zeros(model_mean.num_layers, 1, model_mean.hidden_layer_size))
        y_pred = model_mean(seq.unsqueeze(0))
        single_loss = loss_function(y_pred, labels.view(1, 1))
        single_loss.backward()
        optimizer_mean.step()
    
    if i % 10 == 0:
        print(f'Epoch {i} Loss Min: {single_loss.item()} Loss Mean: {single_loss.item()}')

# 预测未来24小时的温度最小值和平均值
model_min.eval()
model_mean.eval()
future_min_preds = []
future_mean_preds = []

seq_min = X_min_seq[-1].unsqueeze(0)  # 使用最后一个序列
seq_mean = X_mean_seq[-1].unsqueeze(0)  # 使用最后一个序列

timestamps_future = [datetime.now() + timedelta(hours=i+1) for i in range(24)]

for i in range(24):
    with torch.no_grad():
        model_min.hidden_cell = (torch.zeros(model_min.num_layers, 1, model_min.hidden_layer_size),
                                 torch.zeros(model_min.num_layers, 1, model_min.hidden_layer_size))
        future_min_pred = model_min(seq_min)
        future_min_preds.append(future_min_pred.item())
        
        # 更新序列，将预测结果添加到序列末尾，移除最早的数据点
        future_min_pred_extended = future_min_pred.view(1, 1, 1)
        seq_min = torch.cat((seq_min[:, 1:, :], future_min_pred_extended), dim=1)
        
        model_mean.hidden_cell = (torch.zeros(model_mean.num_layers, 1, model_mean.hidden_layer_size),
                                  torch.zeros(model_mean.num_layers, 1, model_mean.hidden_layer_size))
        future_mean_pred = model_mean(seq_mean)
        future_mean_preds.append(future_mean_pred.item())
        
        # 更新序列，将预测结果添加到序列末尾，移除最早的数据点
        future_mean_pred_extended = future_mean_pred.view(1, 1, 1)
        seq_mean = torch.cat((seq_mean[:, 1:, :], future_mean_pred_extended), dim=1)

# 逆归一化
future_min_preds = scaler_min.inverse_transform(np.array(future_min_preds).reshape(-1, 1)).flatten()
future_mean_preds = scaler_mean.inverse_transform(np.array(future_mean_preds).reshape(-1, 1)).flatten()

# 计算结冰概率
def freezing_probability(temp):
    return 1 / (1 + np.exp(3.5409 + 1.2907*temp))

freezing_probs = freezing_probability(future_min_preds)

# 找到第一个结冰概率大于0.5的时间点
risk_hours = None
for i, prob in enumerate(freezing_probs):
    if prob > 0.5:
        risk_hours = i + 1
        break

warning_content = None
if risk_hours is not None:
    warning_content = f"There is a freezing risk in {risk_hours} hours."
    print(warning_content)
else:
    print("No freezing risk in the next 24 hours.")

# 保存预测结果到数据库
table_name = "temperature_prediction_" + datetime.now().strftime('%Y_%m_%d_%H')
try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            hours INT,
            min_temperature_prediction FLOAT,
            mean_temperature_prediction FLOAT
        )
    """)
    
    for i, (min_temp, mean_temp) in enumerate(zip(future_min_preds, future_mean_preds)):
        cursor.execute(f"""
            INSERT INTO {table_name} (hours, min_temperature_prediction, mean_temperature_prediction)
            VALUES (%s, %s, %s)
        """, (i + 1, min_temp, mean_temp))
    
    if warning_content:
        warning_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute(f"""
            INSERT INTO warnings (warning_time, warning_content)
            VALUES (%s, %s)
        """, (warning_time, warning_content))
    
    conn.commit()
except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    cursor.close()
    conn.close()
