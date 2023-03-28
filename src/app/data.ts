export type DataSetName = 'Products' | 'Customers';

export const categories = [
  {
    CategoryId: 1,
    CategoryName: 'Beverages',
  },
  {
    CategoryId: 2,
    CategoryName: 'Condiments',
  },
  {
    CategoryId: 3,
    CategoryName: 'Confections',
  },
  {
    CategoryId: 4,
    CategoryName: 'Dairy Products',
  },
  {
    CategoryId: 5,
    CategoryName: 'Grains/Cereals',
  },
  {
    CategoryId: 6,
    CategoryName: 'Meat/Poultry',
  },
  {
    CategoryId: 7,
    CategoryName: 'Produce',
  },
  {
    CategoryId: 8,
    CategoryName: 'Seafood',
  },
];

export const dataSetFields = {
  Products: [
    { name: 'CategoryName', type: 'text', len: 15 },
    { name: 'ProductName', type: 'text', len: 21 },
    { name: 'QuantityPerUnit', type: 'number', len: 25 },
    { name: 'UnitPrice', type: 'currency', len: 11 },
    { name: 'UnitsInStock', type: 'number', len: 14 },
    { name: 'UnitsOnOrder', type: 'number', len: 14 },
  ],
  Customers: [
    { name: 'CompanyName', type: 'text', len: 30 },
    { name: 'ContactName', type: 'text', len: 20 },
    { name: 'Address', type: 'text', len: 20 },
    { name: 'City', type: 'text', len: 15 },
    { name: 'Country', type: 'text', len: 15 },
  ],
};

export const filterValues = {
  Products: categories.map((cat) => cat.CategoryName),
  Customers: ['USA', 'UK', 'Germany', 'France', 'Canada'],
};

export const dataUrl = {
  Customers: 'https://demodata.grapecity.com/northwind/odata/v1/Customers',
  Products: 'https://demodata.grapecity.com/northwind/odata/v1/Products',
};