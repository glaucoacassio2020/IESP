#ex2.py
n = int(input())
if n % 2 == 0:
    for i in range(0, n + 1, 2):
        print(f"{i}", end=" ")
else:
    for i in range(1, n + 1, 2):
        print(f"{i}", end=" ")
