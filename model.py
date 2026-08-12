import pandas as pd
import numpy as np
import xgboost as xg
from sklearn.model_selection import train_test_split
import shap
from sklearn.metrics import (
    accuracy_score,
    roc_auc_score,
    f1_score,
    recall_score,
    precision_score,
    confusion_matrix
)

df= pd.read_csv(r"C:\Users\Admin\Desktop\NexHack\dataset_12000_records.csv")

df = df.drop(columns=["Patient_ID"])

X = df.drop(columns = ["Readmitted_30_Days"])
y = df["Readmitted_30_Days"]

X = pd.get_dummies(X, drop_first = True)

X_train, X_test, y_train,y_test = train_test_split(X,y, test_size = 0.25, random_state = 42, stratify = y)

model= xg.XGBClassifier (n_estimators = 100 ,  max_depth = 5,
                        learning_rate = 0.05, random_state = 42,
                        subsample = 0.08, eval_metric = "logloss"
                        )
model.fit(X_train,y_train)

y_pred= model.predict(X_test)
y_proba= model.predict_proba(X_test)[:,1]

#evaluation metrics

acc = accuracy_score (y_test, y_pred)
rocauc = roc_auc_score(y_test,y_proba)  
prec = precision_score(y_test, y_pred)
recall = recall_score(y_test,y_pred)

print(f"Accuracy: {acc}, \n ROC_AUC: {rocauc}, \n Precision: {prec}, \n Recall: {recall}")

#confusion matrix
confusion = confusion_matrix(y_test,y_pred)
print(confusion) 

explainer = shap.TreeExplainer(model)
shap_values = explainer(X_test)
#  print(shap_values)

# traning data eval metrics


train_pred = model.predict(X_train)




