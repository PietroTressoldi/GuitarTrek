import { expect, describe, it } from "vitest";
import { notaNaCasa } from "./braco";


describe('braço', () => {
    it('casa 5 da 6ª corda é Lá', () => {
      expect(notaNaCasa(5, 5)).toBe('A')
    })
    it('casa 12 é a oitava da corda solta', () => {
      expect(notaNaCasa(0, 12)).toBe('E')
    })
    it('casa 2 da corda Sol é Lá', () => {
      expect(notaNaCasa(2, 2)).toBe('A')
    })
  })