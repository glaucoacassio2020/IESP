a, b, c = map(int, input().split())

'''
menor = min(a, b, c)
maior = max(a, b, c)
meio = a + b + c - maior - menor
print(menor, meio, maior)
'''

if a > b: a, b = b, a   # a <= b
if a > c: a, c = c, a   # a <= c
if b > c: b, c = c, b   # b <= c
print(a, b, c)
