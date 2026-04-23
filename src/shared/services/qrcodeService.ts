import api, { USE_MOCK } from './api';
import { mockAPI } from './mockService';
import { QRCode } from '../types';

export async function getQrCodes(condId: number): Promise<QRCode[]> {
  try {
    const response = await api.get(`/qrcodes?cond_id=${condId}`);
    if (!response.data && USE_MOCK) {
      return await mockAPI.getQrCodes(condId) as QRCode[];
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.getQrCodes(condId) as QRCode[];
    }
    throw error;
  }
}

export async function gerarQrCode(condId: number, nomePortao: string, expiracaoHoras?: number, usoUnico?: boolean): Promise<QRCode> {
  try {
    const response = await api.post('/qrcodes', {
      cond_id: condId,
      nome_portao: nomePortao,
      expiracao_horas: expiracaoHoras,
      uso_unico: usoUnico
    });
    if (!response.data && USE_MOCK) {
      return await mockAPI.gerarQrCode(condId, nomePortao, expiracaoHoras, usoUnico) as QRCode;
    }
    return response.data;
  } catch (error) {
    if (USE_MOCK) {
      return await mockAPI.gerarQrCode(condId, nomePortao, expiracaoHoras, usoUnico) as QRCode;
    }
    throw error;
  }
}

export async function revogarQrCode(qrId: number): Promise<void> {
  try {
    await api.delete(`/qrcodes/${qrId}`);
  } catch (error) {
    if (USE_MOCK) {
      await mockAPI.revogarQrCode(qrId);
    } else {
      throw error;
    }
  }
}
