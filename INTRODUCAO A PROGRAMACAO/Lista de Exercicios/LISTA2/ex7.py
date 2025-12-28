#ex7.py
n = int(input())
a, b = 0, 1
while a <= n:
    print(f"{a}", end=" ")
    a, b = b, a + b
