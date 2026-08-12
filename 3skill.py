from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression 
from sklearn.metrics import r2_score, mean_squared_error
import pandas as pd
import numpy as np

df = pd.read_csv(r'C:\Users\Admin\Desktop\NexHack\train_dataset.csv')

X = df.drop('overall_yield', axis=1)
y = df['overall_yield']

X_train, X_test, y_train, y_test = train_test_split(
 X, y, test_size=0.3, random_state=42
)

print(f'Train: {X_train.shape[0]}, Test: {X_test.shape[0]}')

# y = mx + c
# ŷ = β₀ + β₁x₁ + β₂x₂ + ... + β xₙ ₙ
# Mean Squared Error  = 1/300 sum(y(pred) - y(act))^2

model = LinearRegression()
model.fit(X_train,y_train)
y_pred=model.predict(X_test)

print(f'R² Score: {r2_score(y_test, y_pred):.4f}')
print(f'MSE: {mean_squared_error(y_test, y_pred):.4f}')
print(f'RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}')

