// Hand-written reference lists for the fictional "Sahyadri Bank" playground
// dataset. Everything that needs to read like a real Indian bank (branches,
// names, feedback text) lives here; the row generator in bank.ts combines
// these with a seeded PRNG so every load produces byte-identical tables.

export interface BranchSeed {
  id: number;
  name: string;
  city: string;
  state: string;
  ifsc: string;
  openedOn: string;
  manager: string;
}

export const BRANCHES: BranchSeed[] = [
  { id: 101, name: 'Fort', city: 'Mumbai', state: 'Maharashtra', ifsc: 'SAHY0000101', openedOn: '2009-03-16', manager: 'Deepak Kulkarni' },
  { id: 102, name: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', ifsc: 'SAHY0000102', openedOn: '2012-11-05', manager: 'Farah Contractor' },
  { id: 103, name: 'Connaught Place', city: 'New Delhi', state: 'Delhi', ifsc: 'SAHY0000103', openedOn: '2010-08-23', manager: 'Harpreet Gill' },
  { id: 104, name: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', ifsc: 'SAHY0000104', openedOn: '2014-01-20', manager: 'Manjunath Hegde' },
  { id: 105, name: 'T. Nagar', city: 'Chennai', state: 'Tamil Nadu', ifsc: 'SAHY0000105', openedOn: '2011-06-13', manager: 'Lakshmi Venkatesan' },
  { id: 106, name: 'Salt Lake', city: 'Kolkata', state: 'West Bengal', ifsc: 'SAHY0000106', openedOn: '2015-09-01', manager: 'Sourav Banerjee' },
  { id: 107, name: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', ifsc: 'SAHY0000107', openedOn: '2016-04-11', manager: 'Padma Reddy' },
  { id: 108, name: 'Satellite', city: 'Ahmedabad', state: 'Gujarat', ifsc: 'SAHY0000108', openedOn: '2018-02-26', manager: 'Jignesh Patel' },
];

// 40 customers. Two deliberate look-alike pairs (two "Priya Sharma", two
// "Rahul Verma") so a learner discovers why cust_id — never cust_name — is
// the join key. Order here == cust_id order (1001..1040).
export const CUSTOMER_NAMES: string[] = [
  'Aarav Mehta', 'Priya Sharma', 'Rohan Iyer', 'Sneha Kulkarni', 'Vikram Singh',
  'Ananya Bose', 'Karthik Raman', 'Neha Agarwal', 'Rahul Verma', 'Divya Nair',
  'Siddharth Jain', 'Meera Pillai', 'Arjun Desai', 'Pooja Reddy', 'Sanjay Gupta',
  'Kavya Krishnan', 'Aditya Rao', 'Ishita Chatterjee', 'Manish Tiwari', 'Shreya Joshi',
  'Nikhil Malhotra', 'Ritu Bhatt', 'Suresh Menon', 'Tanvi Shah', 'Varun Kapoor',
  'Priya Sharma', 'Harish Naidu', 'Lakshmi Subramanian', 'Gaurav Saxena', 'Nandini Hegde',
  'Rahul Verma', 'Swati Deshpande', 'Imran Sheikh', 'Bhavna Trivedi', 'Yash Patel',
  'Ramesh Chandran', 'Sunita Rawat', 'Dev Anand Pillai', 'Anjali Mukherjee', 'Kiran Kumar',
];

export const MERCHANT_CATEGORIES = ['GROCERY', 'FUEL', 'DINING', 'TRAVEL', 'UTILITIES', 'SHOPPING', 'HEALTH', 'ENTERTAINMENT'] as const;

export interface FeedbackSeed { text: string; sentiment: number | null; category: string | null; rating: number }

// ai_sentiment / ai_category mimic Cortex SENTIMENT() and CLASSIFY_TEXT()
// output. Two rows are deliberately unscored (NULL) — the batch job "has not
// run yet" — so NULL handling in aggregates has something real to bite on.
export const FEEDBACK: FeedbackSeed[] = [
  { text: 'The new mobile app is fast and the UPI flow is finally reliable.', sentiment: 0.82, category: 'APP', rating: 5 },
  { text: 'Waited 45 minutes at the branch just to update my address.', sentiment: -0.71, category: 'BRANCH', rating: 2 },
  { text: 'Home loan was sanctioned within a week. Very smooth process.', sentiment: 0.88, category: 'LOAN', rating: 5 },
  { text: 'Why am I charged a fee for a failed ATM withdrawal?', sentiment: -0.64, category: 'FEES', rating: 2 },
  { text: 'Relationship manager calls back promptly, appreciate the service.', sentiment: 0.76, category: 'SERVICE', rating: 5 },
  { text: 'App keeps logging me out every two minutes. Unusable.', sentiment: -0.85, category: 'APP', rating: 1 },
  { text: 'Fixed deposit rates are decent but the renewal form is confusing.', sentiment: 0.05, category: 'SERVICE', rating: 3 },
  { text: 'Card got blocked while travelling abroad with no warning.', sentiment: -0.79, category: 'SERVICE', rating: 1 },
  { text: 'Branch staff at Koramangala were patient and helpful.', sentiment: 0.7, category: 'BRANCH', rating: 4 },
  { text: 'Annual card fee went up without any notice.', sentiment: -0.58, category: 'FEES', rating: 2 },
  { text: 'Statement download works fine now, thanks for fixing it.', sentiment: 0.55, category: 'APP', rating: 4 },
  { text: 'EMI got debited twice this month. Still waiting for the refund.', sentiment: -0.9, category: 'LOAN', rating: 1 },
  { text: 'Net banking transfer limits are too low for my business.', sentiment: -0.42, category: 'SERVICE', rating: 2 },
  { text: 'Good experience overall, nothing to complain about.', sentiment: 0.6, category: 'SERVICE', rating: 4 },
  { text: 'Passbook printing machine has been broken for a month.', sentiment: -0.55, category: 'BRANCH', rating: 2 },
  { text: 'Gold loan interest is competitive compared to other banks.', sentiment: 0.66, category: 'LOAN', rating: 4 },
  { text: 'Support chat gave a canned reply and closed my ticket.', sentiment: -0.74, category: 'SERVICE', rating: 1 },
  { text: 'Love the spend analytics in the app.', sentiment: 0.8, category: 'APP', rating: 5 },
  { text: 'Minimum balance charges were applied on a salary account.', sentiment: -0.68, category: 'FEES', rating: 2 },
  { text: 'Parking at the Fort branch is impossible.', sentiment: -0.35, category: 'BRANCH', rating: 3 },
  { text: 'The car loan top-up was approved quickly.', sentiment: 0.72, category: 'LOAN', rating: 4 },
  { text: 'Neutral. Service is fine, rates could be better.', sentiment: 0.1, category: 'SERVICE', rating: 3 },
  { text: 'Biometric login fails on my phone after the last update.', sentiment: -0.62, category: 'APP', rating: 2 },
  { text: 'Requested a cheque book on Monday, still not delivered.', sentiment: null, category: null, rating: 2 },
  { text: 'Nice branch, friendly staff, quick locker access.', sentiment: null, category: null, rating: 5 },
];

export interface WarehouseSeed { name: string; team: string; size: string; minCredits: number; maxCredits: number }

export const WAREHOUSES: WarehouseSeed[] = [
  { name: 'ETL_WH', team: 'DATA_ENG', size: 'MEDIUM', minCredits: 4, maxCredits: 9 },
  { name: 'ANALYTICS_WH', team: 'FINANCE', size: 'LARGE', minCredits: 10, maxCredits: 22 },
  { name: 'REPORTING_WH', team: 'RISK', size: 'SMALL', minCredits: 1.5, maxCredits: 4 },
  { name: 'ADHOC_WH', team: 'MARKETING', size: 'XSMALL', minCredits: 0.3, maxCredits: 1.5 },
  { name: 'DATASCIENCE_WH', team: 'DATA_SCIENCE', size: 'XLARGE', minCredits: 18, maxCredits: 45 },
];

export const QUERY_USERS = ['ANITA_R', 'BALAJI_K', 'CHARU_M', 'DINESH_P', 'ETL_SVC', 'FARHAN_A', 'GEETA_N', 'REPORT_SVC'] as const;
