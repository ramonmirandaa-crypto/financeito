/**
 * Utilitários de formatação brasileira para Financeito
 * Formatação consistente de moeda e data para todo o projeto
 */

// Configurações de localização brasileira
const PT_BR_LOCALE = 'pt-BR';
const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';
const BRL_CURRENCY_OPTIONS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const BRL_NUMBER_OPTIONS: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/**
 * Formata um valor numérico como moeda brasileira (R$ 1.234,56)
 * @param value - Valor a ser formatado
 * @param showSymbol - Se deve mostrar o símbolo R$ (padrão: true)
 * @returns String formatada como moeda brasileira
 */
export function formatCurrency(value: number, showSymbol: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol ? 'R$ 0,00' : '0,00';
  }

  if (showSymbol) {
    return new Intl.NumberFormat(PT_BR_LOCALE, BRL_CURRENCY_OPTIONS).format(value);
  } else {
    return new Intl.NumberFormat(PT_BR_LOCALE, BRL_NUMBER_OPTIONS).format(value);
  }
}

/**
 * Formata uma data no formato brasileiro (dd/MM/yyyy)
 * @param date - Data a ser formatada (string, Date ou timestamp)
 * @returns String formatada como dd/MM/yyyy
 */
export function formatDate(date: string | Date | number): string {
  if (!date) return '--';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '--';

  return new Intl.DateTimeFormat(PT_BR_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: BRAZIL_TIME_ZONE
  }).format(dateObj);
}

/**
 * Formata uma data com hora no formato brasileiro (dd/MM/yyyy às HH:mm)
 * @param date - Data a ser formatada (string, Date ou timestamp)
 * @returns String formatada como dd/MM/yyyy às HH:mm
 */
export function formatDateTime(date: string | Date | number): string {
  if (!date) return '--';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '--';

  return new Intl.DateTimeFormat(PT_BR_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BRAZIL_TIME_ZONE
  }).format(dateObj);
}

/**
 * Formata uma data de forma compacta (dd/MM)
 * @param date - Data a ser formatada (string, Date ou timestamp)
 * @returns String formatada como dd/MM
 */
export function formatDateShort(date: string | Date | number): string {
  if (!date) return '--';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '--';

  return new Intl.DateTimeFormat(PT_BR_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    timeZone: BRAZIL_TIME_ZONE
  }).format(dateObj);
}

const isoDateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const ISO_DATE_REGEX = /^(\d{4}-\d{2}-\d{2})/;

const getIsoDateFormatter = (timeZone: string) => {
  if (!isoDateFormatterCache.has(timeZone)) {
    isoDateFormatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    );
  }

  return isoDateFormatterCache.get(timeZone)!;
};

/**
 * Normaliza datas para o formato YYYY-MM-DD respeitando o fuso horário brasileiro.
 * Essencial para agrupar transações diárias sem mudanças inesperadas próximas da meia-noite.
 * @param value - Valor de data a ser normalizado
 * @param timeZone - Fuso horário alvo (padrão: America/Sao_Paulo)
 * @returns Data formatada como YYYY-MM-DD
 */
export function formatDateToISODate(
  value?: string | Date | number | null,
  timeZone: string = BRAZIL_TIME_ZONE
): string {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    const match = trimmedValue.match(ISO_DATE_REGEX);
    if (match) {
      return match[1];
    }
  }

  const dateCandidate =
    value !== null && value !== undefined && value !== ''
      ? new Date(value)
      : new Date();

  if (Number.isNaN(dateCandidate.getTime())) {
    return getIsoDateFormatter(timeZone).format(new Date());
  }

  return getIsoDateFormatter(timeZone).format(dateCandidate);
}

/**
 * Calcula diferença de dias entre duas datas
 * @param date1 - Primeira data
 * @param date2 - Segunda data (padrão: hoje)
 * @returns Número de dias de diferença (positivo se date1 > date2)
 */
export function daysDifference(date1: string | Date | number, date2: string | Date | number = new Date()): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

  const timeDiff = d1.getTime() - d2.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Verifica se uma data está vencida
 * @param date - Data a verificar
 * @returns true se a data é anterior à hoje
 */
export function isOverdue(date: string | Date | number): boolean {
  return daysDifference(date) < 0;
}

/**
 * Verifica se uma data está próxima do vencimento (próximos 7 dias)
 * @param date - Data a verificar
 * @param days - Quantos dias considerar como "próximo" (padrão: 7)
 * @returns true se a data está nos próximos N dias
 */
export function isUpcoming(date: string | Date | number, days: number = 7): boolean {
  const diff = daysDifference(date);
  return diff >= 0 && diff <= days;
}

/**
 * Formata valor com indicação de positivo/negativo
 * @param value - Valor a ser formatado
 * @param showSign - Se deve mostrar o sinal + para valores positivos
 * @returns Objeto com valor formatado e classe CSS
 */
export function formatCurrencyWithSign(value: number, showSign: boolean = false) {
  const isPositive = value >= 0;
  const formatted = formatCurrency(Math.abs(value));

  return {
    value: showSign && isPositive ? `+${formatted}` : (isPositive ? formatted : `-${formatted}`),
    className: isPositive ? 'text-green-400' : 'text-red-400',
    isPositive
  };
}
