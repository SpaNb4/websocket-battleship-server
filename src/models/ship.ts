export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  healthPoints: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export type ShipWithoutHealth = Omit<Ship, 'healthPoints'>;
