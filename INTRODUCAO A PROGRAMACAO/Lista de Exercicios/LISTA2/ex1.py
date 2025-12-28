#ex1.py
sum = 0
for _ in range(2):
    n = int(input())
    sum += n
print(f"{sum} o resultado é par" if sum % 2 == 0 else f"{sum} o resultado é impar")
