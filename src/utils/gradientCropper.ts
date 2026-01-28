interface CropRegion {
  x: number;
  y: number; 
  width: number;
  height: number;
}

interface ThumbnailSize {
  width: number;
  height: number;
}

const CROP_REGIONS: Record<'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5', CropRegion> = {
  // Formato quadrado - região central interessante
  square: { 
    x: 0.25,      // 25% da esquerda
    y: 0.25,      // 25% do topo  
    width: 0.5,   // 50% da largura
    height: 0.5   // 50% da altura
  },
  
  // Formato vertical - faixa vertical interessante
  vertical: { 
    x: 0.3,       // 30% da esquerda
    y: 0.1,       // 10% do topo
    width: 0.4,   // 40% da largura
    height: 0.8   // 80% da altura
  },
  
  // Formato horizontal - faixa horizontal interessante  
  horizontal: { 
    x: 0.1,       // 10% da esquerda
    y: 0.3,       // 30% do topo
    width: 0.8,   // 80% da largura
    height: 0.4   // 40% da altura
  },
  
  // Carrossel 1:1 - região superior esquerda para diferenciação
  'carousel-1:1': { 
    x: 0.15,      // 15% da esquerda
    y: 0.15,      // 15% do topo
    width: 0.7,   // 70% da largura
    height: 0.7   // 70% da altura
  },
  
  // Carrossel 4:5 - faixa vertical superior para diferenciação
  'carousel-4:5': { 
    x: 0.2,       // 20% da esquerda
    y: 0.05,      // 5% do topo
    width: 0.6,   // 60% da largura
    height: 0.9   // 90% da altura
  }
};

export const createGradientThumbnail = async (
  gradientPath: string,
  format: 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5',
  thumbnailSize: ThumbnailSize
): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Iniciando criação de thumbnail:', { gradientPath, format, thumbnailSize });
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onerror = (error) => {
      console.error('❌ Erro ao carregar imagem gradiente:', { error, gradientPath });
      reject(new Error(`Falha ao carregar gradiente: ${gradientPath}`));
    };
    
    img.onload = () => {
      console.log('✅ Imagem gradiente carregada:', { 
        width: img.width, 
        height: img.height, 
        src: img.src 
      });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('❌ Não foi possível obter contexto do canvas');
        reject(new Error('Contexto do canvas não disponível'));
        return;
      }
      
      // Configurar tamanho do thumbnail (2x para qualidade)
      canvas.width = thumbnailSize.width * 2;
      canvas.height = thumbnailSize.height * 2;
      
      // Obter região de crop
      const crop = CROP_REGIONS[format];
      const sourceX = img.width * crop.x;
      const sourceY = img.height * crop.y;
      const sourceWidth = img.width * crop.width;
      const sourceHeight = img.height * crop.height;
      
      // Extrair pedaço específico do gradiente
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,    // Source (crop)
        0, 0, canvas.width, canvas.height               // Destination (thumbnail)
      );
      
      // Adicionar overlay sutil para melhor contraste
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // DEBUG: Confirmação e informações do thumbnail
      console.log('🎨 THUMBNAIL CRIADO:', { 
        format, 
        canvasSize: { width: canvas.width, height: canvas.height },
        thumbnailSize,
        cropRegion: crop,
        sourceSize: { width: img.width, height: img.height }
      });
      
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      console.log('✅ Thumbnail gerado com sucesso, tamanho:', dataUrl.length);
      resolve(dataUrl);
    };
    
    console.log('📥 Carregando imagem:', gradientPath);
    img.src = gradientPath;
  });
};

export const createCSSGradientThumbnail = async (
  gradientStyle: string,
  format: 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5',
  thumbnailSize: ThumbnailSize
): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Criando thumbnail CSS:', { gradientStyle, format, thumbnailSize });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ Não foi possível obter contexto do canvas');
      reject(new Error('Contexto do canvas não disponível'));
      return;
    }
    
    // Configurar tamanho do thumbnail (2x para qualidade)
    canvas.width = thumbnailSize.width * 2;
    canvas.height = thumbnailSize.height * 2;
    
    // Criar gradiente baseado no estilo CSS
    let gradient;
    
    // Parse do CSS gradient
    if (gradientStyle.includes('linear-gradient')) {
      // Extrair direção e cores do linear-gradient
      const match = gradientStyle.match(/linear-gradient\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',').map(p => p.trim());
        const direction = parts[0];
        
        // Determinar coordenadas baseado na direção
        const x0 = 0, y0 = 0, x1 = 0, y1 = 0;
        
        if (direction.includes('deg')) {
          const angle = parseInt(direction);
          const radians = (angle * Math.PI) / 180;
          x1 = Math.cos(radians) * canvas.width;
          y1 = Math.sin(radians) * canvas.height;
        } else if (direction.includes('90deg')) {
          x1 = canvas.width;
        } else if (direction.includes('180deg')) {
          y1 = canvas.height;
        } else {
          // Diagonal padrão
          x1 = canvas.width;
          y1 = canvas.height;
        }
        
        gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        
        // Adicionar cores
        for (let i = 1; i < parts.length; i++) {
          const colorPart = parts[i].trim();
          const colorMatch = colorPart.match(/(#[a-fA-F0-9]{6}|rgba?\([^)]+\))\s*(\d+%)?/);
          if (colorMatch) {
            const color = colorMatch[1];
            const position = colorMatch[2] ? parseFloat(colorMatch[2]) / 100 : (i - 1) / (parts.length - 2);
            gradient.addColorStop(position, color);
          }
        }
      }
    }
    
    // Fallback para gradiente simples se parsing falhar
    if (!gradient) {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
    }
    
    // Preencher canvas com o gradiente
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Adicionar overlay sutil para melhor contraste
    const overlayGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    overlayGradient.addColorStop(0, 'rgba(0,0,0,0.1)');
    overlayGradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/png', 0.9);
    
    console.log('✅ Thumbnail CSS gerado:', { 
      format, 
      canvasSize: { width: canvas.width, height: canvas.height },
      thumbnailSize,
      dataUrlLength: dataUrl.length
    });
    
    resolve(dataUrl);
  });
};