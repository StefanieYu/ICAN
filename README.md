说明：
1.web文件夹下是网站源文件。

2.服务器上运行的脚本包括steady_temp_prev.py和temp_pre.py。
其中steady_temp_prev.py脚本是PINN模型预测空间温度，temp_pre.py脚本使用LSTM模型预测未来24小时的最低温度和平均温度（目前其准确性未知，bug较多，调试困难）
