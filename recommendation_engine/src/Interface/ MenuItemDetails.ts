export interface MenuItemDetails {
    name: string;
    description: string;
    price: string;
    category: string;
    availabilityStatus?: boolean;
    dietaryRestriction: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';
    spiceLevel: 'High' | 'Medium' | 'Low';
    regionalPreference: 'North Indian' | 'South Indian' | 'Other';
    isSweet?: boolean;
  }