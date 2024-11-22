import sqlite3
import csv
conn = sqlite3.connect('api/database/db.sqlite')
cur = conn.cursor()

command1 = """CREATE TABLE IF NOT EXISTS 
customers (customer_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        firstname TEXT NOT NULL,
        infix TEXT NULL,
        lastname TEXT NOT NULL,
        street TEXT NOT NULL,
        housenumber INT NOT NULL,
        suffix TEXT NULL,
        zipcode TEXT NOT NULL,
        city TEXT NOT NULL,
        country_id INT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        newsletter INT NULL,
        userrole_id INT NOT NULL,
        CONSTRAINT customers_FK FOREIGN KEY (country_id) REFERENCES countries(countries),
        CONSTRAINT customers_FK FOREIGN KEY (userrole_id) REFERENCES userroles(userroles)
        ) """

cur.execute(command1)
print("klantentabel aangemaakt")

fname=input('put csv file name: ')
if len(fname) < 1 : fname= "klanten.csv"

with open(fname) as csv_file:
    csv_reader = csv.reader(csv_file, delimiter= ';')
    for row in csv_reader:
        print(row)
        firstname=row[0] 
        infix=row[1] 
        lastname=row[2] 
        street=row[3] 
        housenumber=row[4] 
        suffix=row[5]
        zipcode =row[6] 
        city=row[7] 
        country_id=row[8] 
        email=row[9] 
        password=row[10] 
        newsletter=row[11]
        userrole_id=row[12]
        cur.execute('''INSERT INTO customers(firstname, infix, lastname, street, housenumber, suffix, zipcode, city, country_id, email, password, newsletter, userrole_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''',(firstname, infix, lastname, street, housenumber, suffix, zipcode, city, country_id, email, password, newsletter, userrole_id))
        
conn.commit()
conn.close()