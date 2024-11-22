import sqlite3
import csv
conn = sqlite3.connect('api/database/db.sqlite')
cur = conn.cursor()

fname=input('put csv file name: ')
if len(fname) < 1 : fname= "klanten.csv"

with open(fname) as csv_file:
    csv_reader = csv.reader(csv_file, delimiter= ';')
    for row in csv_reader:
        print(row)
 
        password=row[10] 

        cur.execute('''INSERT INTO customers(password)
            VALUES (?)''',(password,))
        
conn.commit()
conn.close()