# Splitwise Clone - Expense Splitting Application

A full-stack expense splitting application built with FastAPI (backend) and React (frontend) that helps groups manage shared expenses and calculate optimal debt settlements.

## 🚀 Features

### Core Functionality
- **Expense Management**: Add, view, update, and delete shared expenses
- **Automatic Participant Detection**: Extracts people from expense descriptions
- **Smart Settlement Algorithm**: Calculates optimal debt settlements with minimal transactions
- **Real-time Balance Tracking**: Shows who owes what to whom
- **Responsive UI**: Clean, modern interface with tabbed navigation

### Settlement Algorithm
- **Debt Minimization**: Uses creditor-debtor matching to minimize number of transactions
- **Optimal Payments**: Calculates the most efficient way to settle all debts
- **Floating Point Precision**: Handles currency calculations with proper rounding

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python web framework)
- MongoDB (database)
- Motor (async MongoDB driver)
- Pydantic (data validation)
- UUID-based IDs for easy JSON serialization

**Frontend:**
- React 19
- Tailwind CSS (styling)
- Axios (HTTP client)
- React Router (navigation)

## 📁 Project Structure

```
splitwise-clone/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Tailwind styles
│   │   └── index.js      # React entry point
│   ├── package.json      # Node.js dependencies
│   └── .env              # Frontend environment variables
├── tests/
│   └── backend_test.py   # Comprehensive API tests
└── README.md             # This file
```

## 🔧 Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB (local or cloud instance)

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   Create a `.env` file in the `backend` directory:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=splitwise_clone
   ```

3. **Start the backend server:**
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

### Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 📊 API Endpoints

### Expense Management
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/{id}` - Get a specific expense
- `PUT /api/expenses/{id}` - Update an expense
- `DELETE /api/expenses/{id}` - Delete an expense

### Settlement & Balance
- `GET /api/people` - Get all people from expenses
- `GET /api/balances` - Get net balances for all people
- `GET /api/settlements` - Get optimal settlement transactions

### Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "data": any,
  "message": string
}
```

## 🧪 Testing

### Backend Testing
Run comprehensive API tests:
```bash
cd tests
python backend_test.py
```

The test suite includes:
- CRUD operations for all endpoints
- Settlement algorithm verification
- Balance calculation accuracy
- Input validation testing
- Error handling verification

### Test Scenarios
The system has been tested with these scenarios:
1. Shantanu paid ₹600 for Dinner
2. Sanket paid ₹450 for Groceries
3. Om paid ₹300 for Petrol (updated to ₹350)
4. Shantanu paid ₹500 for Movie Tickets
5. Sanket paid ₹280 for Pizza (then deleted)

## 💡 How the Settlement Algorithm Works

1. **Calculate Net Balances**: For each person, calculate total paid minus total share of expenses
2. **Separate Creditors and Debtors**: Group people who are owed money vs. those who owe money
3. **Optimize Settlements**: Match debtors with creditors to minimize total number of transactions
4. **Generate Transactions**: Create optimal "Person A pays Person B ₹X" instructions

### Example:
- Shantanu: +₹150 (is owed ₹150)
- Sanket: -₹75 (owes ₹75)
- Om: -₹75 (owes ₹75)

**Settlement**: Sanket pays Shantanu ₹75, Om pays Shantanu ₹75

## 🎨 UI Features

### Expense Management
- Add new expenses with amount, description, and payer
- View all expenses with participant details
- Update or delete existing expenses
- Real-time expense totals

### Balance Tracking
- Visual balance display (green for owed, red for owing)
- Clear indication of who owes what
- Sorted by balance amount

### Settlement Display
- Optimal settlement instructions
- Clear "Person A → Person B: ₹X" format
- Minimal transaction count
- Settlement summary

## 🔍 Key Implementation Details

### Data Models
- **Expense**: UUID, amount, description, paid_by, participants, timestamps
- Balance: person, net_balance
- Settlement: from_person, to_person, amount

### Participant Detection
- Auto-extracts common names from expense descriptions
- Falls back to predefined participant list for equal splitting
- Ensures payer is always included in participants

### Currency Handling
- Uses floating-point arithmetic with proper rounding
- Displays amounts in Indian Rupee (₹) format
- Handles precision for settlement calculations

## 🚀 Deployment

### Railway/Render Deployment
1. Connect your GitHub repository
2. Set environment variables in deployment platform
3. Configure build commands:
   - Backend: `pip install -r requirements.txt`
   - Frontend: `npm install & npm run dev`

### Environment Variables for Production
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `REACT_APP_BACKEND_URL`: Backend API URL

## 📝 Future Enhancements

- User authentication and authorization
- Multiple groups/projects support
- Receipt image uploads
- Email notifications for settlements
- Export functionality (PDF, CSV)
- Mobile app version
- Multi-currency support
- Recurring expense tracking

**Built with ❤️ for better expense management**
