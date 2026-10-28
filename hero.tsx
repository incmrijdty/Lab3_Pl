export type HeroClass = 'Wojownik' | 'Paladyn' | 'Czarodziej';

export class Hero {
  constructor(
    public imie: string,
    public klasa: HeroClass,
    public siła: number,
    public wytrzymałość: number,
    public zwinność: number,
    public magia: number,
    public imageUri: string | null = null,
  ) {}
}
