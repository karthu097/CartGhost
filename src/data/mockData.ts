import type { AbandonedCart, Customer, Product, DashboardStats, RevenueDataPoint, ActionBreakdown } from '../types';
import { analyzeCartSync } from '../engine/aiDecisionEngine';

const products: Product[] = [
  { id: 'p1', name: 'Nike Air Max 270', category: 'Footwear', price: 12999, brand: 'Nike', sku: 'NK-AM270-BLK' },
  { id: 'p2', name: 'Levi\'s 511 Slim Jeans', category: 'Apparel', price: 3499, brand: 'Levi\'s', sku: 'LV-511-32' },
  { id: 'p3', name: 'Sony WH-1000XM5', category: 'Electronics', price: 29990, brand: 'Sony', sku: 'SN-WH1000XM5' },
  { id: 'p4', name: 'Puma Running Shoes', category: 'Footwear', price: 5999, brand: 'Puma', sku: 'PM-RS-RED' },
  { id: 'p5', name: 'Apple AirPods Pro', category: 'Electronics', price: 24900, brand: 'Apple', sku: 'AP-APP-2GEN' },
  { id: 'p6', name: 'Zara Floral Dress', category: 'Apparel', price: 4999, brand: 'Zara', sku: 'ZR-FD-M' },
  { id: 'p7', name: 'Adidas Ultraboost 22', category: 'Footwear', price: 15999, brand: 'Adidas', sku: 'AD-UB22-WHT' },
  { id: 'p8', name: 'Samsung Galaxy Watch 5', category: 'Electronics', price: 19999, brand: 'Samsung', sku: 'SG-GW5-BLK' },
  { id: 'p9', name: 'Mango Linen Shirt', category: 'Apparel', price: 2999, brand: 'Mango', sku: 'MG-LS-WHT' },
  { id: 'p10', name: 'Fitbit Charge 5', category: 'Electronics', price: 11990, brand: 'Fitbit', sku: 'FB-C5-BLK' },
  { id: 'p11', name: 'Reebok Classic Leather', category: 'Footwear', price: 6499, brand: 'Reebok', sku: 'RB-CL-WHT' },
  { id: 'p12', name: 'H&M Wool Sweater', category: 'Apparel', price: 2499, brand: 'H&M', sku: 'HM-WS-GRY' },
  { id: 'p13', name: 'JBL Flip 6 Speaker', category: 'Electronics', price: 9999, brand: 'JBL', sku: 'JB-F6-BLU' },
  { id: 'p14', name: 'Woodland Trekking Boots', category: 'Footwear', price: 8999, brand: 'Woodland', sku: 'WL-TB-BRN' },
  { id: 'p15', name: 'UCB Denim Jacket', category: 'Apparel', price: 4499, brand: 'UCB', sku: 'UCB-DJ-BLU' },
  { id: 'p16', name: 'Boat Rockerz 550', category: 'Electronics', price: 3499, brand: 'Boat', sku: 'BT-R550-BLK' },
  { id: 'p17', name: 'New Balance 574', category: 'Footwear', price: 9499, brand: 'New Balance', sku: 'NB-574-GRY' },
  { id: 'p18', name: 'Fabindia Kurta Set', category: 'Apparel', price: 3999, brand: 'Fabindia', sku: 'FI-KS-BLU' },
  { id: 'p19', name: 'Mi Band 7 Pro', category: 'Electronics', price: 4999, brand: 'Xiaomi', sku: 'MI-B7P-BLK' },
  { id: 'p20', name: 'Bata Formal Shoes', category: 'Footwear', price: 2999, brand: 'Bata', sku: 'BT-FS-BLK' },
];

const customers: Customer[] = [
  { id: 'c1', name: 'Rahul Sharma', email: 'rahul.s@gmail.com', city: 'Mumbai', age: 28, segment: 'returning', totalOrders: 4, totalSpent: 45000, joinedDate: '2022-03-15' },
  { id: 'c2', name: 'Priya Patel', email: 'priya.p@gmail.com', city: 'Ahmedabad', age: 25, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-08-01' },
  { id: 'c3', name: 'Arjun Mehta', email: 'arjun.m@outlook.com', city: 'Delhi', age: 32, segment: 'loyal', totalOrders: 12, totalSpent: 178000, joinedDate: '2021-01-10' },
  { id: 'c4', name: 'Sneha Reddy', email: 'sneha.r@yahoo.com', city: 'Hyderabad', age: 27, segment: 'returning', totalOrders: 3, totalSpent: 22000, joinedDate: '2023-05-20' },
  { id: 'c5', name: 'Vikram Singh', email: 'vikram.s@gmail.com', city: 'Bangalore', age: 35, segment: 'loyal', totalOrders: 8, totalSpent: 95000, joinedDate: '2021-11-03' },
  { id: 'c6', name: 'Kavya Nair', email: 'kavya.n@gmail.com', city: 'Kochi', age: 23, segment: 'new', totalOrders: 1, totalSpent: 4500, joinedDate: '2024-07-15' },
  { id: 'c7', name: 'Rohan Gupta', email: 'rohan.g@gmail.com', city: 'Pune', age: 30, segment: 'returning', totalOrders: 5, totalSpent: 67000, joinedDate: '2022-09-12' },
  { id: 'c8', name: 'Ananya Krishnan', email: 'ananya.k@hotmail.com', city: 'Chennai', age: 29, segment: 'at_risk', totalOrders: 2, totalSpent: 15000, joinedDate: '2023-02-28' },
  { id: 'c9', name: 'Manish Joshi', email: 'manish.j@gmail.com', city: 'Jaipur', age: 34, segment: 'loyal', totalOrders: 15, totalSpent: 220000, joinedDate: '2020-06-05' },
  { id: 'c10', name: 'Deepika Rao', email: 'deepika.r@gmail.com', city: 'Bangalore', age: 26, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-09-01' },
  { id: 'c11', name: 'Aditya Kumar', email: 'aditya.k@gmail.com', city: 'Kolkata', age: 31, segment: 'returning', totalOrders: 6, totalSpent: 78000, joinedDate: '2022-04-18' },
  { id: 'c12', name: 'Shreya Mishra', email: 'shreya.m@gmail.com', city: 'Lucknow', age: 24, segment: 'new', totalOrders: 1, totalSpent: 3200, joinedDate: '2024-06-20' },
  { id: 'c13', name: 'Karan Malhotra', email: 'karan.m@gmail.com', city: 'Delhi', age: 29, segment: 'at_risk', totalOrders: 3, totalSpent: 28000, joinedDate: '2022-12-01' },
  { id: 'c14', name: 'Riya Verma', email: 'riya.v@outlook.com', city: 'Mumbai', age: 22, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-08-25' },
  { id: 'c15', name: 'Suresh Iyer', email: 'suresh.i@gmail.com', city: 'Chennai', age: 38, segment: 'loyal', totalOrders: 20, totalSpent: 345000, joinedDate: '2019-03-10' },
  { id: 'c16', name: 'Pooja Agarwal', email: 'pooja.a@gmail.com', city: 'Surat', age: 33, segment: 'returning', totalOrders: 4, totalSpent: 52000, joinedDate: '2022-07-22' },
  { id: 'c17', name: 'Nikhil Bose', email: 'nikhil.b@gmail.com', city: 'Kolkata', age: 27, segment: 'new', totalOrders: 1, totalSpent: 8900, joinedDate: '2024-05-30' },
  { id: 'c18', name: 'Megha Tiwari', email: 'megha.t@yahoo.com', city: 'Bhopal', age: 28, segment: 'at_risk', totalOrders: 2, totalSpent: 18000, joinedDate: '2023-08-14' },
  { id: 'c19', name: 'Amit Choudhary', email: 'amit.c@gmail.com', city: 'Patna', age: 30, segment: 'returning', totalOrders: 5, totalSpent: 43000, joinedDate: '2022-11-09' },
  { id: 'c20', name: 'Swati Deshpande', email: 'swati.d@gmail.com', city: 'Pune', age: 35, segment: 'loyal', totalOrders: 9, totalSpent: 125000, joinedDate: '2021-04-02' },
  { id: 'c21', name: 'Rajesh Khanna', email: 'rajesh.k@gmail.com', city: 'Chandigarh', age: 42, segment: 'loyal', totalOrders: 18, totalSpent: 280000, joinedDate: '2020-01-15' },
  { id: 'c22', name: 'Divya Menon', email: 'divya.m@gmail.com', city: 'Trivandrum', age: 26, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-09-03' },
  { id: 'c23', name: 'Saurabh Pandey', email: 'saurabh.p@hotmail.com', city: 'Varanasi', age: 29, segment: 'returning', totalOrders: 3, totalSpent: 31000, joinedDate: '2023-01-20' },
  { id: 'c24', name: 'Nisha Kapoor', email: 'nisha.k@gmail.com', city: 'Delhi', age: 31, segment: 'at_risk', totalOrders: 4, totalSpent: 39000, joinedDate: '2022-06-08' },
  { id: 'c25', name: 'Gaurav Saxena', email: 'gaurav.s@gmail.com', city: 'Agra', age: 27, segment: 'new', totalOrders: 1, totalSpent: 5600, joinedDate: '2024-04-15' },
  { id: 'c26', name: 'Pallavi Shah', email: 'pallavi.s@gmail.com', city: 'Ahmedabad', age: 34, segment: 'loyal', totalOrders: 11, totalSpent: 167000, joinedDate: '2021-02-28' },
  { id: 'c27', name: 'Abhishek Das', email: 'abhishek.d@gmail.com', city: 'Bhubaneswar', age: 25, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-08-10' },
  { id: 'c28', name: 'Tanvi Jain', email: 'tanvi.j@gmail.com', city: 'Indore', age: 28, segment: 'returning', totalOrders: 6, totalSpent: 71000, joinedDate: '2022-03-05' },
  { id: 'c29', name: 'Harsh Vardhan', email: 'harsh.v@gmail.com', city: 'Nagpur', age: 33, segment: 'at_risk', totalOrders: 2, totalSpent: 20000, joinedDate: '2023-07-12' },
  { id: 'c30', name: 'Anjali Kulkarni', email: 'anjali.k@gmail.com', city: 'Nashik', age: 29, segment: 'returning', totalOrders: 4, totalSpent: 48000, joinedDate: '2022-10-18' },
  { id: 'c31', name: 'Mohit Bansal', email: 'mohit.b@gmail.com', city: 'Faridabad', age: 26, segment: 'new', totalOrders: 1, totalSpent: 7200, joinedDate: '2024-07-01' },
  { id: 'c32', name: 'Preeti Lal', email: 'preeti.l@yahoo.com', city: 'Ranchi', age: 32, segment: 'returning', totalOrders: 5, totalSpent: 54000, joinedDate: '2022-08-30' },
  { id: 'c33', name: 'Tushar Garg', email: 'tushar.g@gmail.com', city: 'Ludhiana', age: 30, segment: 'loyal', totalOrders: 7, totalSpent: 88000, joinedDate: '2021-12-15' },
  { id: 'c34', name: 'Sonali Patil', email: 'sonali.p@gmail.com', city: 'Aurangabad', age: 27, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-08-20' },
  { id: 'c35', name: 'Varun Awasthi', email: 'varun.a@outlook.com', city: 'Allahabad', age: 28, segment: 'at_risk', totalOrders: 3, totalSpent: 25000, joinedDate: '2023-04-10' },
  { id: 'c36', name: 'Rekha Nambiar', email: 'rekha.n@gmail.com', city: 'Kozhikode', age: 36, segment: 'loyal', totalOrders: 13, totalSpent: 190000, joinedDate: '2020-09-22' },
  { id: 'c37', name: 'Piyush Rastogi', email: 'piyush.r@gmail.com', city: 'Kanpur', age: 24, segment: 'new', totalOrders: 1, totalSpent: 4100, joinedDate: '2024-06-05' },
  { id: 'c38', name: 'Madhuri Desai', email: 'madhuri.d@gmail.com', city: 'Baroda', age: 31, segment: 'returning', totalOrders: 6, totalSpent: 69000, joinedDate: '2022-05-14' },
  { id: 'c39', name: 'Sandeep Bhatt', email: 'sandeep.b@gmail.com', city: 'Rajkot', age: 29, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-09-02' },
  { id: 'c40', name: 'Ishita Roy', email: 'ishita.r@hotmail.com', city: 'Siliguri', age: 25, segment: 'returning', totalOrders: 3, totalSpent: 27000, joinedDate: '2023-06-18' },
  { id: 'c41', name: 'Venkat Subramanian', email: 'venkat.s@gmail.com', city: 'Coimbatore', age: 40, segment: 'loyal', totalOrders: 22, totalSpent: 390000, joinedDate: '2019-08-05' },
  { id: 'c42', name: 'Priyanka Dubey', email: 'priyanka.d@gmail.com', city: 'Gwalior', age: 26, segment: 'new', totalOrders: 1, totalSpent: 6800, joinedDate: '2024-07-28' },
  { id: 'c43', name: 'Rajat Sharma', email: 'rajat.s@gmail.com', city: 'Meerut', age: 32, segment: 'at_risk', totalOrders: 2, totalSpent: 19000, joinedDate: '2023-09-01' },
  { id: 'c44', name: 'Smita Hegde', email: 'smita.h@gmail.com', city: 'Mangalore', age: 34, segment: 'loyal', totalOrders: 10, totalSpent: 148000, joinedDate: '2021-03-20' },
  { id: 'c45', name: 'Abhinav Yadav', email: 'abhinav.y@gmail.com', city: 'Jhansi', age: 27, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-08-15' },
  { id: 'c46', name: 'Sudha Krishnamurti', email: 'sudha.k@gmail.com', city: 'Mysore', age: 37, segment: 'loyal', totalOrders: 16, totalSpent: 235000, joinedDate: '2020-04-12' },
  { id: 'c47', name: 'Nitin Srivastava', email: 'nitin.s@gmail.com', city: 'Gorakhpur', age: 30, segment: 'returning', totalOrders: 4, totalSpent: 41000, joinedDate: '2022-12-25' },
  { id: 'c48', name: 'Ankita Sharma', email: 'ankita.s@yahoo.com', city: 'Noida', age: 28, segment: 'returning', totalOrders: 5, totalSpent: 58000, joinedDate: '2022-09-08' },
  { id: 'c49', name: 'Manoj Tripathi', email: 'manoj.t@gmail.com', city: 'Agra', age: 45, segment: 'at_risk', totalOrders: 1, totalSpent: 12000, joinedDate: '2023-11-14' },
  { id: 'c50', name: 'Farida Khan', email: 'farida.k@gmail.com', city: 'Lucknow', age: 29, segment: 'new', totalOrders: 0, totalSpent: 0, joinedDate: '2024-09-04' },
];

function makeCart(
  id: string,
  customer: Customer,
  product: Product,
  qty: number,
  hoursAgo: number,
  behavior: {
    timeSpentMinutes: number;
    productViews: number;
    sizeChartViews: number;
    reviewsRead: number;
    photosViewed: number;
    compareActions: number;
    addToWishlist: boolean;
    returnVisits: number;
  },
  prevPurchases: number,
  abandonHistory: number,
  device: 'mobile' | 'desktop' | 'tablet',
  source: 'organic' | 'paid' | 'email' | 'social' | 'direct',
  actionStatus: 'pending' | 'sent' | 'converted' | 'ignored' | 'failed',
  recoveredRevenue?: number
): AbandonedCart {
  const cartValue = product.price * qty;
  const abandonedAt = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

  // Build a partial cart first so the engine can read all signals
  const partialCart: AbandonedCart = {
    id,
    customer,
    items: [{ product, quantity: qty, subtotal: cartValue }],
    cartValue,
    abandonedAt,
    sessionDuration: behavior.timeSpentMinutes,
    behavior,
    previousPurchases: prevPurchases,
    abandonmentHistory: abandonHistory,
    deviceType: device,
    source,
    // Placeholder — immediately overwritten below
    aiDecision: {
      reason: 'price_sensitivity',
      confidence: 0,
      recoveryProbability: 0,
      recommendedAction: 'send_personalized_reminder',
      explanation: '',
      discountRecommended: false,
    },
    actionStatus,
    recoveredRevenue,
  };

  // Run the real AI engine synchronously — every cart gets a genuine decision
  partialCart.aiDecision = analyzeCartSync(partialCart);

  return partialCart;
}

export const mockCarts: AbandonedCart[] = [
  makeCart('cart1', customers[0], products[3], 1, 2, { timeSpentMinutes: 18, productViews: 12, sizeChartViews: 4, reviewsRead: 6, photosViewed: 8, compareActions: 0, addToWishlist: true, returnVisits: 2 }, 3, 1, 'desktop', 'organic', 'sent'),
  makeCart('cart2', customers[1], products[2], 1, 5, { timeSpentMinutes: 8, productViews: 6, sizeChartViews: 0, reviewsRead: 3, photosViewed: 4, compareActions: 2, addToWishlist: false, returnVisits: 0 }, 0, 0, 'mobile', 'paid', 'pending'),
  makeCart('cart3', customers[2], products[0], 1, 1, { timeSpentMinutes: 25, productViews: 15, sizeChartViews: 5, reviewsRead: 10, photosViewed: 12, compareActions: 1, addToWishlist: true, returnVisits: 3 }, 12, 3, 'desktop', 'direct', 'converted', 12999),
  makeCart('cart4', customers[3], products[5], 2, 8, { timeSpentMinutes: 12, productViews: 8, sizeChartViews: 3, reviewsRead: 4, photosViewed: 6, compareActions: 0, addToWishlist: false, returnVisits: 1 }, 3, 2, 'mobile', 'social', 'sent'),
  makeCart('cart5', customers[4], products[6], 1, 3, { timeSpentMinutes: 20, productViews: 10, sizeChartViews: 2, reviewsRead: 7, photosViewed: 9, compareActions: 3, addToWishlist: true, returnVisits: 2 }, 8, 4, 'desktop', 'email', 'converted', 15999),
  makeCart('cart6', customers[5], products[1], 1, 12, { timeSpentMinutes: 5, productViews: 4, sizeChartViews: 0, reviewsRead: 1, photosViewed: 3, compareActions: 1, addToWishlist: false, returnVisits: 0 }, 1, 0, 'mobile', 'paid', 'pending'),
  makeCart('cart7', customers[6], products[7], 1, 6, { timeSpentMinutes: 15, productViews: 9, sizeChartViews: 1, reviewsRead: 5, photosViewed: 7, compareActions: 2, addToWishlist: false, returnVisits: 1 }, 5, 2, 'desktop', 'organic', 'sent'),
  makeCart('cart8', customers[7], products[4], 1, 24, { timeSpentMinutes: 3, productViews: 3, sizeChartViews: 0, reviewsRead: 0, photosViewed: 2, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 2, 1, 'mobile', 'social', 'failed'),
  makeCart('cart9', customers[8], products[2], 1, 4, { timeSpentMinutes: 30, productViews: 18, sizeChartViews: 0, reviewsRead: 12, photosViewed: 14, compareActions: 4, addToWishlist: true, returnVisits: 5 }, 15, 5, 'desktop', 'direct', 'converted', 29990),
  makeCart('cart10', customers[9], products[9], 1, 9, { timeSpentMinutes: 6, productViews: 5, sizeChartViews: 0, reviewsRead: 2, photosViewed: 4, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 0, 0, 'mobile', 'paid', 'pending'),
  makeCart('cart11', customers[10], products[11], 2, 18, { timeSpentMinutes: 10, productViews: 7, sizeChartViews: 2, reviewsRead: 3, photosViewed: 5, compareActions: 1, addToWishlist: true, returnVisits: 1 }, 6, 1, 'tablet', 'email', 'sent'),
  makeCart('cart12', customers[11], products[8], 1, 36, { timeSpentMinutes: 4, productViews: 3, sizeChartViews: 1, reviewsRead: 1, photosViewed: 2, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 1, 0, 'mobile', 'organic', 'ignored'),
  makeCart('cart13', customers[12], products[0], 1, 7, { timeSpentMinutes: 22, productViews: 14, sizeChartViews: 6, reviewsRead: 8, photosViewed: 11, compareActions: 2, addToWishlist: false, returnVisits: 2 }, 3, 3, 'desktop', 'paid', 'pending'),
  makeCart('cart14', customers[13], products[5], 1, 48, { timeSpentMinutes: 7, productViews: 5, sizeChartViews: 2, reviewsRead: 2, photosViewed: 4, compareActions: 0, addToWishlist: true, returnVisits: 1 }, 0, 0, 'mobile', 'social', 'sent'),
  makeCart('cart15', customers[14], products[7], 1, 2, { timeSpentMinutes: 35, productViews: 20, sizeChartViews: 0, reviewsRead: 15, photosViewed: 16, compareActions: 3, addToWishlist: true, returnVisits: 4 }, 20, 6, 'desktop', 'direct', 'converted', 19999),
  makeCart('cart16', customers[15], products[3], 2, 14, { timeSpentMinutes: 16, productViews: 11, sizeChartViews: 3, reviewsRead: 5, photosViewed: 8, compareActions: 1, addToWishlist: false, returnVisits: 2 }, 4, 2, 'desktop', 'email', 'sent'),
  makeCart('cart17', customers[16], products[12], 1, 20, { timeSpentMinutes: 8, productViews: 6, sizeChartViews: 0, reviewsRead: 2, photosViewed: 5, compareActions: 2, addToWishlist: false, returnVisits: 0 }, 1, 1, 'mobile', 'paid', 'pending'),
  makeCart('cart18', customers[17], products[1], 2, 72, { timeSpentMinutes: 5, productViews: 4, sizeChartViews: 1, reviewsRead: 1, photosViewed: 3, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 2, 2, 'mobile', 'organic', 'ignored'),
  makeCart('cart19', customers[18], products[6], 1, 11, { timeSpentMinutes: 19, productViews: 12, sizeChartViews: 2, reviewsRead: 6, photosViewed: 9, compareActions: 1, addToWishlist: true, returnVisits: 1 }, 5, 3, 'desktop', 'email', 'sent'),
  makeCart('cart20', customers[19], products[4], 1, 3, { timeSpentMinutes: 28, productViews: 17, sizeChartViews: 1, reviewsRead: 11, photosViewed: 13, compareActions: 5, addToWishlist: true, returnVisits: 3 }, 9, 4, 'desktop', 'direct', 'converted', 24900),
  makeCart('cart21', customers[20], products[2], 1, 6, { timeSpentMinutes: 40, productViews: 22, sizeChartViews: 0, reviewsRead: 18, photosViewed: 18, compareActions: 4, addToWishlist: true, returnVisits: 6 }, 18, 7, 'desktop', 'direct', 'converted', 29990),
  makeCart('cart22', customers[21], products[8], 1, 26, { timeSpentMinutes: 4, productViews: 3, sizeChartViews: 1, reviewsRead: 0, photosViewed: 2, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 0, 0, 'mobile', 'social', 'pending'),
  makeCart('cart23', customers[22], products[10], 1, 15, { timeSpentMinutes: 12, productViews: 8, sizeChartViews: 3, reviewsRead: 4, photosViewed: 6, compareActions: 1, addToWishlist: false, returnVisits: 1 }, 3, 2, 'mobile', 'paid', 'sent'),
  makeCart('cart24', customers[23], products[14], 1, 32, { timeSpentMinutes: 9, productViews: 6, sizeChartViews: 2, reviewsRead: 3, photosViewed: 5, compareActions: 0, addToWishlist: true, returnVisits: 1 }, 4, 3, 'desktop', 'email', 'ignored'),
  makeCart('cart25', customers[24], products[19], 1, 44, { timeSpentMinutes: 6, productViews: 4, sizeChartViews: 0, reviewsRead: 1, photosViewed: 3, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 1, 0, 'mobile', 'organic', 'pending'),
  makeCart('cart26', customers[25], products[3], 1, 1, { timeSpentMinutes: 32, productViews: 19, sizeChartViews: 5, reviewsRead: 13, photosViewed: 15, compareActions: 2, addToWishlist: true, returnVisits: 4 }, 11, 5, 'desktop', 'direct', 'sent'),
  makeCart('cart27', customers[26], products[15], 1, 55, { timeSpentMinutes: 3, productViews: 2, sizeChartViews: 0, reviewsRead: 0, photosViewed: 2, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 0, 0, 'mobile', 'paid', 'ignored'),
  makeCart('cart28', customers[27], products[0], 1, 8, { timeSpentMinutes: 21, productViews: 13, sizeChartViews: 4, reviewsRead: 7, photosViewed: 10, compareActions: 1, addToWishlist: false, returnVisits: 2 }, 6, 3, 'tablet', 'email', 'sent'),
  makeCart('cart29', customers[28], products[16], 1, 19, { timeSpentMinutes: 7, productViews: 5, sizeChartViews: 1, reviewsRead: 2, photosViewed: 4, compareActions: 2, addToWishlist: false, returnVisits: 0 }, 2, 2, 'mobile', 'organic', 'pending'),
  makeCart('cart30', customers[29], products[5], 2, 5, { timeSpentMinutes: 14, productViews: 9, sizeChartViews: 3, reviewsRead: 5, photosViewed: 7, compareActions: 0, addToWishlist: true, returnVisits: 1 }, 4, 1, 'desktop', 'social', 'converted', 9998),
  makeCart('cart31', customers[30], products[17], 1, 28, { timeSpentMinutes: 6, productViews: 5, sizeChartViews: 1, reviewsRead: 1, photosViewed: 3, compareActions: 1, addToWishlist: false, returnVisits: 0 }, 1, 1, 'mobile', 'paid', 'pending'),
  makeCart('cart32', customers[31], products[9], 1, 40, { timeSpentMinutes: 11, productViews: 7, sizeChartViews: 0, reviewsRead: 3, photosViewed: 5, compareActions: 2, addToWishlist: false, returnVisits: 1 }, 5, 2, 'desktop', 'email', 'sent'),
  makeCart('cart33', customers[32], products[6], 1, 10, { timeSpentMinutes: 24, productViews: 16, sizeChartViews: 2, reviewsRead: 9, photosViewed: 12, compareActions: 3, addToWishlist: true, returnVisits: 3 }, 7, 4, 'desktop', 'direct', 'converted', 15999),
  makeCart('cart34', customers[33], products[11], 1, 62, { timeSpentMinutes: 4, productViews: 3, sizeChartViews: 1, reviewsRead: 1, photosViewed: 2, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 0, 0, 'mobile', 'social', 'ignored'),
  makeCart('cart35', customers[34], products[13], 1, 16, { timeSpentMinutes: 8, productViews: 6, sizeChartViews: 2, reviewsRead: 3, photosViewed: 5, compareActions: 0, addToWishlist: true, returnVisits: 1 }, 3, 2, 'mobile', 'organic', 'sent'),
  makeCart('cart36', customers[35], products[7], 1, 4, { timeSpentMinutes: 38, productViews: 21, sizeChartViews: 0, reviewsRead: 16, photosViewed: 17, compareActions: 5, addToWishlist: true, returnVisits: 5 }, 13, 6, 'desktop', 'direct', 'converted', 19999),
  makeCart('cart37', customers[36], products[18], 1, 30, { timeSpentMinutes: 5, productViews: 4, sizeChartViews: 0, reviewsRead: 1, photosViewed: 3, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 1, 0, 'mobile', 'paid', 'pending'),
  makeCart('cart38', customers[37], products[0], 1, 22, { timeSpentMinutes: 17, productViews: 11, sizeChartViews: 3, reviewsRead: 6, photosViewed: 8, compareActions: 2, addToWishlist: false, returnVisits: 2 }, 6, 3, 'desktop', 'email', 'sent'),
  makeCart('cart39', customers[38], products[4], 1, 52, { timeSpentMinutes: 3, productViews: 2, sizeChartViews: 0, reviewsRead: 0, photosViewed: 2, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 0, 0, 'mobile', 'social', 'pending'),
  makeCart('cart40', customers[39], products[16], 1, 13, { timeSpentMinutes: 13, productViews: 9, sizeChartViews: 2, reviewsRead: 4, photosViewed: 6, compareActions: 1, addToWishlist: true, returnVisits: 1 }, 3, 1, 'tablet', 'organic', 'sent'),
  makeCart('cart41', customers[40], products[2], 1, 3, { timeSpentMinutes: 45, productViews: 25, sizeChartViews: 0, reviewsRead: 20, photosViewed: 20, compareActions: 6, addToWishlist: true, returnVisits: 7 }, 22, 8, 'desktop', 'direct', 'converted', 29990),
  makeCart('cart42', customers[41], products[5], 1, 35, { timeSpentMinutes: 6, productViews: 5, sizeChartViews: 2, reviewsRead: 2, photosViewed: 3, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 1, 0, 'mobile', 'paid', 'pending'),
  makeCart('cart43', customers[42], products[14], 1, 25, { timeSpentMinutes: 9, productViews: 7, sizeChartViews: 1, reviewsRead: 3, photosViewed: 5, compareActions: 2, addToWishlist: false, returnVisits: 1 }, 2, 2, 'mobile', 'organic', 'ignored'),
  makeCart('cart44', customers[43], products[1], 2, 7, { timeSpentMinutes: 26, productViews: 17, sizeChartViews: 4, reviewsRead: 11, photosViewed: 13, compareActions: 2, addToWishlist: true, returnVisits: 3 }, 10, 4, 'desktop', 'email', 'converted', 6998),
  makeCart('cart45', customers[44], products[3], 1, 46, { timeSpentMinutes: 4, productViews: 3, sizeChartViews: 0, reviewsRead: 1, photosViewed: 2, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 0, 0, 'mobile', 'social', 'pending'),
  makeCart('cart46', customers[45], products[7], 1, 2, { timeSpentMinutes: 42, productViews: 23, sizeChartViews: 0, reviewsRead: 17, photosViewed: 19, compareActions: 5, addToWishlist: true, returnVisits: 6 }, 16, 7, 'desktop', 'direct', 'sent'),
  makeCart('cart47', customers[46], products[10], 1, 17, { timeSpentMinutes: 10, productViews: 7, sizeChartViews: 2, reviewsRead: 4, photosViewed: 5, compareActions: 1, addToWishlist: false, returnVisits: 1 }, 4, 2, 'desktop', 'email', 'sent'),
  makeCart('cart48', customers[47], products[8], 1, 9, { timeSpentMinutes: 15, productViews: 10, sizeChartViews: 3, reviewsRead: 5, photosViewed: 7, compareActions: 0, addToWishlist: true, returnVisits: 2 }, 5, 2, 'mobile', 'organic', 'converted', 2999),
  makeCart('cart49', customers[48], products[6], 1, 60, { timeSpentMinutes: 5, productViews: 4, sizeChartViews: 0, reviewsRead: 1, photosViewed: 3, compareActions: 0, addToWishlist: false, returnVisits: 0 }, 1, 3, 'mobile', 'paid', 'ignored'),
  makeCart('cart50', customers[49], products[18], 1, 4, { timeSpentMinutes: 7, productViews: 5, sizeChartViews: 0, reviewsRead: 2, photosViewed: 4, compareActions: 1, addToWishlist: false, returnVisits: 0 }, 0, 0, 'mobile', 'social', 'pending'),
];

export const dashboardStats: DashboardStats = {
  totalAbandonedValue: mockCarts.reduce((s, c) => s + c.cartValue, 0),
  recoverableRevenue: Math.round(
    mockCarts.reduce((s, c) => s + Math.round((c.cartValue * c.aiDecision.recoveryProbability) / 100), 0)
  ),
  recoveryRate: Math.round(
    (mockCarts.filter((c) => c.actionStatus === 'converted').length / mockCarts.length) * 1000
  ) / 10,
  totalAbandonedCarts: mockCarts.length,
  aiSuccessRate: Math.round(
    (mockCarts.filter((c) => c.aiDecision.recoveryProbability >= 60).length / mockCarts.length) * 100 * 10
  ) / 10,
  averageCartValue: Math.round(mockCarts.reduce((s, c) => s + c.cartValue, 0) / mockCarts.length),
  cartsRecoveredToday: mockCarts.filter((c) => c.actionStatus === 'converted').length,
  discountsAvoided: mockCarts.filter((c) => !c.aiDecision.discountRecommended && c.actionStatus !== 'ignored').length,
};

export const revenueData: RevenueDataPoint[] = [
  { date: 'Aug 27', abandoned: 145000, recovered: 48000, potential: 58000 },
  { date: 'Aug 28', abandoned: 132000, recovered: 42000, potential: 52000 },
  { date: 'Aug 29', abandoned: 168000, recovered: 61000, potential: 70000 },
  { date: 'Aug 30', abandoned: 155000, recovered: 55000, potential: 64000 },
  { date: 'Aug 31', abandoned: 178000, recovered: 68000, potential: 75000 },
  { date: 'Sep 1', abandoned: 162000, recovered: 58000, potential: 67000 },
  { date: 'Sep 2', abandoned: 191000, recovered: 72000, potential: 82000 },
  { date: 'Sep 3', abandoned: 148000, recovered: 51000, potential: 60000 },
  { date: 'Sep 4', abandoned: 173000, recovered: 63000, potential: 71000 },
  { date: 'Sep 5', abandoned: 186000, recovered: 71000, potential: 78000 },
];

// Derive action breakdown from actual AI decisions on the 50 carts
const ACTION_SUCCESS_RATES: Record<string, number> = {
  send_size_recommendation: 82,
  send_personalized_reminder: 58,
  offer_discount: 91,
  recommend_alternative: 65,
  answer_product_concern: 74,
  no_action: 12,
  offer_payment_options: 86,
  send_shipping_offer: 78,
  send_price_match: 70,
};

const ACTION_REVENUE_PER_CART: Record<string, number> = {
  send_size_recommendation: 11200,
  send_personalized_reminder: 7400,
  offer_discount: 19500,
  recommend_alternative: 9800,
  answer_product_concern: 13600,
  no_action: 0,
  offer_payment_options: 16800,
  send_shipping_offer: 8900,
  send_price_match: 10500,
};

export const actionBreakdown: ActionBreakdown[] = (() => {
  const counts: Record<string, number> = {};
  for (const cart of mockCarts) {
    const a = cart.aiDecision.recommendedAction;
    counts[a] = (counts[a] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([action, count]) => ({
      action: action as ActionBreakdown['action'],
      count,
      successRate: ACTION_SUCCESS_RATES[action] ?? 60,
      revenueRecovered: (ACTION_REVENUE_PER_CART[action] ?? 8000) * count,
    }))
    .sort((a, b) => b.count - a.count);
})();
