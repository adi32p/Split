import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = "http://localhost:8000"; // Add your backend URL here
const API = `${BACKEND_URL}/api`;

function App() {
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');

  // Form state
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    paid_by: ''
  });

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesRes, balancesRes, settlementsRes, peopleRes] = await Promise.all([
        axios.get(`${API}/expenses`),
        axios.get(`${API}/balances`),
        axios.get(`${API}/settlements`),
        axios.get(`${API}/people`)
      ]);

      setExpenses(expensesRes.data.data || []);
      setBalances(balancesRes.data.data || []);
      setSettlements(settlementsRes.data.data || []);
      setPeople(peopleRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  // Create expense
  const createExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description || !newExpense.paid_by) {
      alert('Please fill all fields');
      return;
    }

    try {
      await axios.post(`${API}/expenses`, {
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        paid_by: newExpense.paid_by
      });
      
      setNewExpense({ amount: '', description: '', paid_by: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Error creating expense');
    }
  };

  // Delete expense
const deleteExpense = async (id) => {
  if (!window.confirm('Are you sure you want to delete this expense?')) return;
  
  try {
    const response = await axios.delete(`${API}/expenses/${id}`);
    if (response.data.success) {
      alert('Expense deleted successfully!');
      fetchData(); // Refresh the list
    } else {
      alert('Failed to delete expense: ' + response.data.message);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || 
                   error.response?.statusText || 
                   error.message;
    alert(`Error deleting expense: ${errorMsg}`);
    console.error('Delete error details:', error);
  }
};

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-900">SplitWise Clone</h1>
                <p className="text-sm text-gray-500">Manage shared expenses easily</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {people.length} people • {expenses.length} expenses
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'expenses', label: 'Expenses', count: expenses.length },
              { id: 'balances', label: 'Balances', count: balances.length },
              { id: 'settlements', label: 'Settlements', count: settlements.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === 'expenses' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Expenses</h2>
                  </div>
                  <div className="p-6">
                    {expenses.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No expenses found. Add your first expense!</p>
                    ) : (
                      <div className="space-y-4">
                        {expenses.map((expense) => (
                          <div key={expense.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{expense.description}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Paid by <span className="font-medium capitalize">{expense.paid_by}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                  Split among: {expense.participants.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(expense.date_created).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-semibold text-green-600">
                                  {formatCurrency(expense.amount)}
                                </span>
                                <button
                                  onClick={() => deleteExpense(expense.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'balances' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Balances</h2>
                    <p className="text-sm text-gray-500">Who owes what</p>
                  </div>
                  <div className="p-6">
                    {balances.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No balances to show</p>
                    ) : (
                      <div className="space-y-3">
                        {balances.map((balance) => (
                          <div key={balance.person} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                            <span className="font-medium text-gray-900 capitalize">{balance.person}</span>
                            <span className={`font-semibold ${
                              balance.balance > 0 ? 'text-green-600' : balance.balance < 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {balance.balance > 0 ? '+' : ''}{formatCurrency(balance.balance)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settlements' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Settlements</h2>
                    <p className="text-sm text-gray-500">Optimal way to settle all debts</p>
                  </div>
                  <div className="p-6">
                    {settlements.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Everyone is settled up! 🎉</p>
                    ) : (
                      <div className="space-y-4">
                        {settlements.map((settlement, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="capitalize font-medium text-gray-900">{settlement.from_person}</span>
                                <svg className="w-5 h-5 mx-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                <span className="capitalize font-medium text-gray-900">{settlement.to_person}</span>
                              </div>
                              <span className="text-lg font-semibold text-blue-600">
                                {formatCurrency(settlement.amount)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="capitalize">{settlement.from_person}</span> pays <span className="capitalize">{settlement.to_person}</span> {formatCurrency(settlement.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Add Expense Form */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg sticky top-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Add Expense</h2>
                </div>
                <form onSubmit={createExpense} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What was this expense for?"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paid by
                    </label>
                    <input
                      type="text"
                      value={newExpense.paid_by}
                      onChange={(e) => setNewExpense({...newExpense, paid_by: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Who paid for this?"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Add Expense
                  </button>
                </form>

                {/* Quick Stats */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Expenses:</span>
                      <span className="font-medium">{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Active People:</span>
                      <span className="font-medium">{people.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pending Settlements:</span>
                      <span className="font-medium">{settlements.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;