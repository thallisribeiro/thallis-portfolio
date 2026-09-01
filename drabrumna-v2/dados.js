/* Único ponto de edição dos dados ainda não confirmados.
   Enquanto o valor continuar entre colchetes, o site trata o dado como pendente:
   os botões de WhatsApp ficam desativados com aviso, e os campos de identificação
   médica aparecem com marcação de pendência em vez de um número inventado.

   Para publicar, troque apenas os valores abaixo. Nada mais precisa mudar. */

window.DADOS_BRUMNA = {
  whatsapp: {
    florianopolis: '[WHATSAPP_FLORIANOPOLIS]',
    saoPaulo: '[WHATSAPP_SAO_PAULO]',
  },
  mensagemInicial: {
    florianopolis: 'Olá! Gostaria de agendar uma consulta em Florianópolis.',
    saoPaulo: 'Olá! Gostaria de agendar uma consulta em São Paulo.',
  },
  registros: {
    crmDraBrumna: '[CRM_DRA_BRUMNA]',
    crmDrThiagoNassif: '[CRM_DR_THIAGO_NASSIF]',
    rqeDrThiagoNassif: '[RQE_DR_THIAGO_NASSIF]',
  },
  enderecos: {
    imv: '[ENDERECO_IMV]',
    fakiani: '[ENDERECO_CLINICA_FAKIANI]',
  },
  horarios: {
    florianopolis: '[HORARIOS_FLORIANOPOLIS]',
    saoPaulo: '[HORARIOS_SAO_PAULO]',
  },
  avaliacoesGoogle: '[URL_GOOGLE_REVIEWS_OU_PLACE_ID]',
  redes: '[INSTAGRAM_E_OUTRAS_REDES_CONFIRMADAS]',
  dominioFinal: '[DOMINIO_FINAL]',
  email: '[EMAIL_DE_CONTATO]',
  responsavelPrivacidade: '[DADOS_DO_RESPONSAVEL_PELA_PRIVACIDADE]',
};
