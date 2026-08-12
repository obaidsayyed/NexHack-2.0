from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
import xgboost
from sklearn.metrics import mean_squared_error, r2_score

df= pd.read_csv (r"C:\Users\Admin\Desktop\NexHack\train_dataset.csv")

X = df.drop("overall_yield",axis = 1)
y = df["overall_yield"]

X_train, X_test, y_train, y_test = train_test_split( X,y,test_size= 0.21,random_state=18)

model = xgboost.XGBRegressor(n_estimators = 100, learning_rate = 0.01, max_depth = 3, random_state = 42)
model.fit(X_train,y_train)

y_pred = model.predict (X_test)
mse = mean_squared_error(y_test,y_pred)
rmse= np.sqrt(mse)
r2= r2_score(y_test,y_pred)

print(f"{mse},\n {rmse}, \n{r2}")
