import { Prisma } from '@prisma/client'

type SerializedValue<T> = T extends Prisma.Decimal
  ? number
  : T extends Date
    ? string
    : T extends Array<infer U>
      ? SerializedValue<U>[]
      : T extends Record<string, unknown>
        ? { [K in keyof T]: SerializedValue<T[K]> }
        : T

const isDecimal = (value: unknown): value is Prisma.Decimal =>
  value instanceof Prisma.Decimal ||
  (typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as Prisma.Decimal).toNumber === 'function')

const serializeValue = <T>(value: T): SerializedValue<T> => {
  if (value === null || value === undefined) {
    return value as SerializedValue<T>
  }

  if (isDecimal(value)) {
    return value.toNumber() as SerializedValue<T>
  }

  if (value instanceof Date) {
    return value.toISOString() as SerializedValue<T>
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item)) as SerializedValue<T>
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeValue(entry)
    }
    return result as SerializedValue<T>
  }

  return value as SerializedValue<T>
}

export const serializeBudget = <T>(budget: T): SerializedValue<T> => serializeValue(budget)
export const serializeGoal = <T>(goal: T): SerializedValue<T> => serializeValue(goal)
export const serializeSubscription = <T>(subscription: T): SerializedValue<T> => serializeValue(subscription)
export const serializeLoan = <T>(loan: T): SerializedValue<T> => serializeValue(loan)

export type SerializedBudget<T> = SerializedValue<T>
export type SerializedGoal<T> = SerializedValue<T>
export type SerializedSubscription<T> = SerializedValue<T>
export type SerializedLoan<T> = SerializedValue<T>
