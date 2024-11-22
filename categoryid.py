import sqlite3
import csv
conn = sqlite3.connect('api/database/db.sqlite')
cur = conn.cursor()

command2 = """CREATE TABLE IF NOT EXISTS 
categories (categoryid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL
        ) """

cur.execute(command2)
print("producttabel aangemaakt")

fname=input('csv file name: ')
if len(fname) < 1 : fname= "productimport.csv"

with open(fname) as csv_file:
    csv_reader = csv.reader(csv_file, delimiter= ';')
    for row in csv_reader:
        print(row)
        category_id=row[8]
        name=row[0]
      
        cur.execute('''INSERT INTO categories(category_id,name)
            VALUES (?,?)''',(category_id,name))
        
conn.commit()
conn.close()