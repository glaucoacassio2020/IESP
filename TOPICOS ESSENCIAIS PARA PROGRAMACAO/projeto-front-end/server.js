require('dotenv').config(); 
const express = require('express');
const multer = require('multer');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const port = 3000;

// CORS - PERMITIR REQUISIÇÕES DE QUALQUER ORIGEM
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Setup da OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let openai;

if (!OPENAI_API_KEY) {
    console.error("\n========================================================");
    console.error("ERRO CRÍTICO: CHAVE NÃO CARREGADA.");
    console.error("Crie um arquivo .env com:");
    console.error("OPENAI_API_KEY=sua_chave_aqui");
    console.error("========================================================\n");
    process.exit(1); 
} else {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log("SUCESSO: Sua chave API foi carregada.");
}

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 10 } 
});

// Servir arquivos estáticos do src
app.use(express.static(path.join(__dirname, 'src'))); 
app.use(express.json());

// Converter imagem para base64
function fileToBase64(file) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

// ROTA PRINCIPAL - GERAÇÃO DE LOOKS COM GPT-4 VISION + DALL-E 3
app.post('/generate-outfit', upload.array('images', 10), async (req, res) => {
    const descricao = req.body.descricao || '';
    const uploadedFiles = req.files || [];
    
    console.log(`\n╔══════════════════════════════════════════════╗`);
    console.log(`║  Fashion AI                                  ║`);
    console.log(`╚══════════════════════════════════════════════╝`);
    console.log(`Imagens enviadas: ${uploadedFiles.length}`);
    console.log(`Descrição: "${descricao}"`);

    if (uploadedFiles.length === 0 && !descricao) {
        return res.status(400).json({ 
            message: "É necessário enviar imagens e/ou uma descrição." 
        });
    }
    
    let generated_looks = [];

    try {
        // 1. ANÁLISE COM GPT-4 (Vision se tiver imagens)
        console.log("\n Analisando...");
        
        let messages;
        let analysisPrompt;

        // CASO 1: TEM IMAGENS - Usar GPT-4 Vision
        if (uploadedFiles.length > 0) {
            console.log("   Modo: GPT-4 Vision (com imagens)");
            
            const imageMessages = uploadedFiles.map(file => ({
                type: "image_url",
                image_url: {
                    url: fileToBase64(file),
                    detail: "high"
                }
            }));

            analysisPrompt = `
Você é um estilista profissional. Analise as ${uploadedFiles.length} peças de roupa nas imagens.

DESCRIÇÃO DO USUÁRIO: "${descricao}"
CONTEXTO: Verão, 25°C, ensolarado

TAREFA:
1. Identifique TODAS as peças (cores, estilos, tipos)
2. Crie 2-3 looks DIFERENTES combinando essas peças
3. Para CADA look, gere 2 prompts para DALL-E 3:
   - Prompt 1: FLAT LAY (vista de cima)
   - Prompt 2: MODELO usando o look

REGRAS:
✓ NÃO invente peças que não foram enviadas
✓ NÃO repita o mesmo look
✓ Use TODAS as peças em combinações diferentes
✓ Seja ESPECÍFICO nas cores e detalhes

FORMATO - Retorne APENAS este JSON:

[
  {
    "look_number": 1,
    "is_recommended": true,
    "flat_lay_prompt": "Flat lay photo of clothing items neatly arranged: [descreva CADA peça com cor]. Top view, neutral beige background, product photography, clean and organized, minimalist style, soft lighting.",
    "model_prompt": "Full body photo of a fashion model WEARING [descreva CADA peça com cor e estilo]. Modern urban street setting. Natural lighting, professional fashion photography, editorial style, realistic, 35mm lens, confident pose.",
    "description": "Look Recomendado: [descrição amigável em português]",
    "style": "Casual Moderno",
    "pieces_used": ["peça1", "peça2", "peça3"]
  }
]

IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional.
`;

            messages = [
                {
                    role: "user",
                    content: [
                        { type: "text", text: analysisPrompt },
                        ...imageMessages
                    ]
                }
            ];
        } 
        // CASO 2: SÓ TEXTO - Usar GPT-4 normal
        else {
            console.log("   Modo: apenas texto (sem imagens)");
            
            analysisPrompt = `
Você é um estilista profissional. Crie looks baseados na descrição do usuário.

DESCRIÇÃO DO USUÁRIO: "${descricao}"
CONTEXTO: Verão, 25°C, ensolarado

TAREFA:
1. Interprete o que o usuário quer (ocasião, estilo, cores preferidas)
2. Crie 2-3 looks COMPLETOS e DIFERENTES para essa ocasião
3. Para CADA look, gere 2 prompts detalhados para DALL-E 3:
   - Prompt 1: FLAT LAY (vista de cima das peças organizadas)
   - Prompt 2: MODELO usando o look completo

REGRAS:
✓ Seja criativo mas realista
✓ Cada look deve ser ÚNICO e diferente dos outros
✓ Descreva peças ESPECÍFICAS (cores exatas, tecidos, detalhes)
✓ Adapte ao contexto (clima quente, ocasião mencionada)

EXEMPLOS DE DESCRIÇÃO:
- "Look 1: Vestido midi floral azul e branco + sandália rasteira bege"
- "Look 2: Blusa branca de linho + shorts jeans claro + tênis branco"

FORMATO - Retorne APENAS este JSON (SEM texto antes ou depois):

[
  {
    "look_number": 1,
    "is_recommended": true,
    "flat_lay_prompt": "Flat lay photo of summer clothing items neatly arranged: [liste CADA peça com COR e TECIDO específicos]. Top view, neutral beige background, product photography, clean and organized, minimalist style, soft lighting, high detail.",
    "model_prompt": "Full body photo of a fashion model WEARING [descreva CADA peça com COR, ESTILO e FIT específicos]. Modern urban street setting, summer day. Natural lighting, professional fashion photography, editorial style, realistic, 35mm lens, confident pose, detailed clothing texture.",
    "description": "Look Recomendado: [descrição amigável em português]",
    "style": "Casual de Verão",
    "pieces_used": ["peça1 com cor", "peça2 com cor", "peça3 com cor"]
  },
  {
    "look_number": 2,
    "is_recommended": false,
    "flat_lay_prompt": "Flat lay photo of summer clothing items neatly arranged: [liste CADA peça DIFERENTE do Look 1]. Top view, neutral beige background, product photography, clean and organized, minimalist style, soft lighting.",
    "model_prompt": "Full body photo of a fashion model WEARING [descreva CADA peça DIFERENTE do Look 1]. Modern urban street setting, summer day. Natural lighting, professional fashion photography, editorial style, realistic, 35mm lens.",
    "description": "Look Alternativo: [descrição amigável em português]",
    "style": "Esportivo Chic",
    "pieces_used": ["peça1", "peça2", "peça3"]
  }
]

CRÍTICO: Retorne APENAS o array JSON válido. Sem explicações, sem markdown, sem código.
`;

            messages = [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ];
        }

        const gptResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            max_tokens: 2500,
            temperature: 0.7
        });

        const gptResponseText = gptResponse.choices[0].message.content.trim();
        console.log("   ✅ Análise concluída");
        console.log(`   Resposta (primeiros 200 chars): ${gptResponseText.substring(0, 200)}...`);

        // Limpeza agressiva do JSON
        let cleanedJsonText = gptResponseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^[^[\{]*/, '') // Remove tudo antes do primeiro [ ou {
            .replace(/[^}\]]*$/, '') // Remove tudo depois do último } ou ]
            .trim();

        console.log(`   Tentando parsear JSON (${cleanedJsonText.length} caracteres)`);

        let combinations = [];
        
        try {
            combinations = JSON.parse(cleanedJsonText);
            if (!Array.isArray(combinations)) {
                combinations = [combinations];
            }
            console.log(`   ✅ JSON parseado: ${combinations.length} looks`);
        } catch (parseError) {
            console.error(`   ❌ ERRO ao parsear JSON: ${parseError.message}`);
            console.log("   Texto limpo:", cleanedJsonText.substring(0, 500));
            
            // FALLBACK - criar look genérico baseado na descrição
            console.log("   Usando FALLBACK...");
            
            const fallbackStyle = descricao.toLowerCase().includes('festa') ? 'Festa' :
                                 descricao.toLowerCase().includes('trabalho') ? 'Executivo' :
                                 descricao.toLowerCase().includes('praia') ? 'Praia' :
                                 'Casual';
            
            combinations = [
                {
                    look_number: 1,
                    is_recommended: true,
                    flat_lay_prompt: `Flat lay photo of ${fallbackStyle.toLowerCase()} summer clothing items neatly arranged on neutral beige background. Top view, product photography, clean and organized, minimalist style, soft lighting.`,
                    model_prompt: `Full body photo of a fashion model wearing ${fallbackStyle.toLowerCase()} summer outfit. Modern urban setting, natural lighting, professional fashion photography, editorial style, realistic.`,
                    description: `Look ${fallbackStyle}: ${descricao}`,
                    style: fallbackStyle,
                    pieces_used: []
                }
            ];
        }

        if (combinations.length === 0) {
            throw new Error("A IA retornou um array vazio após o fallback.");
        }

        console.log(`   Total de imagens a gerar: ${combinations.length * 2}`);

        // 2. GERAÇÃO DE IMAGENS COM DALL-E 3
        console.log("\n Gerando imagens...");

        const generationPromises = [];

        for (let i = 0; i < combinations.length; i++) {
            const combination = combinations[i];
            const lookNumber = combination.look_number || i + 1;
            const isRecommended = combination.is_recommended === true;
            
            console.log(`\n   ━━━ LOOK ${lookNumber} ${isRecommended ? '⭐ RECOMENDADO' : ''} ━━━`);

            // IMAGEM 1: FLAT LAY
            generationPromises.push(
                (async () => {
                    console.log(`   [${lookNumber}.1] Gerando FLAT LAY...`);
                    const image = await openai.images.generate({
                        model: "dall-e-3",
                        prompt: combination.flat_lay_prompt,
                        n: 1,
                        size: "1024x1024",
                        quality: isRecommended ? "hd" : "standard",
                    });
                    console.log(`   ✅ Flat lay gerado`);
                    return {
                        image_url: image.data[0].url,
                        description: combination.description,
                        style: combination.style || "Casual",
                        is_recommended: isRecommended,
                        look_type: "FLAT LAY",
                        pieces_used: combination.pieces_used || [],
                        look_number: lookNumber
                    };
                })()
            );

            // IMAGEM 2: MODELO
            generationPromises.push(
                (async () => {
                    console.log(`   [${lookNumber}.2] Gerando MODELO...`);
                    const image = await openai.images.generate({
                        model: "dall-e-3",
                        prompt: combination.model_prompt,
                        n: 1,
                        size: "1024x1024",
                        quality: isRecommended ? "hd" : "standard",
                    });
                    console.log(`   ✅ Modelo gerado`);
                    return {
                        image_url: image.data[0].url,
                        description: combination.description,
                        style: combination.style || "Casual",
                        is_recommended: isRecommended,
                        look_type: "MODELO",
                        pieces_used: combination.pieces_used || [],
                        look_number: lookNumber
                    };
                })()
            );
        }

        generated_looks = await Promise.all(generationPromises);

        console.log("\n✅ TODOS OS LOOKS GERADOS!");
        console.log(`   ${combinations.length} looks completos`);
        console.log(`   ${generated_looks.length} imagens totais (2 por look)`);
        console.log("════════════════════════════════════════════════\n");

        return res.status(200).json({
            message: `${combinations.length} looks gerados com sucesso!`,
            generated_looks: generated_looks
        });
        
    } catch (error) {
        console.error("\n========================================================");
        console.error("ERRO CRÍTICO:");
        console.error(error); 
        console.error("========================================================\n");
        
        let errorMessage = "Falha ao processar. Verifique o terminal.";
        
        if (error.message && error.message.includes('billing')) {
            errorMessage = "ERRO: Limite de créditos atingido. Adicione créditos na OpenAI.";
        } else if (error.message && error.message.includes('429')) {
            errorMessage = "ERRO 429: Rate limit. Aguarde alguns minutos.";
        } else if (error.message && error.message.includes('insufficient_quota')) {
            errorMessage = "ERRO: Saldo insuficiente na OpenAI. Adicione créditos.";
        }
        
        return res.status(500).json({ 
            message: errorMessage,
            error: error.message
        });
    }
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        mode: '100% OpenAI',
        ai_analysis: 'GPT-4 Vision',
        image_generation: 'DALL-E 3',
        features: [
            'Análise de imagens com GPT-4 Vision',
            'Geração de looks inteligente',
            '2 imagens por look (flat lay + modelo)',
            'Look recomendado em HD',
            'Suporte para texto sem imagens'
        ]
    });
});

app.listen(port, () => {
    console.log("\n╔══════════════════════════════════════════════╗");
    console.log("║   Fashion AI                                 ║");
    console.log("╚══════════════════════════════════════════════╝");
    console.log(`Servidor: http://localhost:${port}`);
    console.log(`Rodando arquivos de: ${path.join(__dirname, 'src')}`);
    console.log("════════════════════════════════════════════════\n");
});