import math

a, b, c = map(int, input().split())

# Calculo do delta
delta = b**2 - 4 * a * c
if delta < 0:
    print('Impossivel calcular')
else:
    x1 = (-b + math.sqrt(delta)) / (2 * a)
    x2 = (-b - math.sqrt(delta)) / (2 * a)
    print(f"As raízes são: x1 = {x1}, x2 = {x2}")
