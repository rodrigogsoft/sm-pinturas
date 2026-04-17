import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, Alert } from '@mui/material';
import { Edit, Clear, Check } from '@mui/icons-material';

interface SignatureCanvasProps {
  onSignatureConfirm: (signatureDataUrl: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureConfirm,
  onClear,
  width = 600,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Configurar canvas com fundo branco
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setHasConfirmed(false);
    setSignaturePreview(null);
    onClear?.();
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Converter canvas para base64
    const dataUrl = canvas.toDataURL('image/png');
    setSignaturePreview(dataUrl);
    setHasConfirmed(true);
    onSignatureConfirm(dataUrl);
  };

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        ✍️ Assinatura Digital (obrigatória)
      </Typography>

      {!hasConfirmed ? (
        <Paper
          elevation={2}
          sx={{
            p: 2,
            border: '2px dashed #ccc',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Desenhe sua assinatura usando o mouse
          </Typography>

          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'crosshair',
              touchAction: 'none',
              maxWidth: '100%',
              display: 'block',
              margin: '0 auto',
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Clear />}
              onClick={clearCanvas}
              disabled={isEmpty}
            >
              Limpar
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Check />}
              onClick={confirmSignature}
              disabled={isEmpty}
            >
              Confirmar Assinatura
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ p: 2, bgcolor: '#f0f9ff' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            ✅ Assinatura capturada com sucesso!
          </Alert>

          {signaturePreview && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img
                src={signaturePreview}
                alt="Assinatura"
                style={{
                  maxWidth: '100%',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </Box>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={() => {
              setHasConfirmed(false);
              clearCanvas();
            }}
            fullWidth
          >
            Refazer Assinatura
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default SignatureCanvas;
