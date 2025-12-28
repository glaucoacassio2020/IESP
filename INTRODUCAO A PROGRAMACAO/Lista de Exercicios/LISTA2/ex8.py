#ex8.py
group1 = group2 = group3 = 0

while True:
    age = int(input())
    if age >= 0 and age <= 25:
        group1 += 1
    elif age >= 26 and age <= 60:
        group2 += 1
    elif age > 60:
        group3 += 1
    else:
        print("Idade invalida")
    cont = input("Continuar? (s/n) ").strip().lower()[0]
    if cont == "n":
        break

print(group1, group2, group3)
