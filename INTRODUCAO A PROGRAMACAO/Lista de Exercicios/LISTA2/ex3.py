#ex3.py
while True:
    print("Menu:")
    print("1 - Continuar")
    print("2 - Sair")

    option = int(input())

    if option == 1:
        print("Opcao 1 selecionada.")
    elif option == 2:
        print("Saindo...")
        break
    else:
        print("Valor inválido!\n")
