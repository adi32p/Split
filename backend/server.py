from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from collections import defaultdict
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from bson import ObjectId 
# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'splitwise_clone')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# API Router
api_router = APIRouter(prefix="/api")

# ======================
# MODELS
# ======================
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: str

class ExpenseCreate(BaseModel):
    amount: float
    description: str
    paid_by: str
    participants: Optional[List[str]] = None

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    paid_by: Optional[str] = None
    participants: Optional[List[str]] = None

class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float
    description: str
    paid_by: str
    participants: List[str]
    date_created: datetime = Field(default_factory=datetime.utcnow)
    date_updated: datetime = Field(default_factory=datetime.utcnow)

class Settlement(BaseModel):
    from_person: str
    to_person: str
    amount: float

class Balance(BaseModel):
    person: str
    balance: float

# ======================
# UTILITY FUNCTIONS
# ======================
def extract_people_from_description(description: str, paid_by: str) -> List[str]:
    common_names = ["shantanu", "sanket", "om", "amit", "raj", "priya", "ravi", "deepak", "anita", "vikram"]
    found_people = set([paid_by.lower()])
    description = description.lower()
    for name in common_names:
        if name in description:
            found_people.add(name)
    if len(found_people) == 1:
        return ["shantanu", "sanket", "om"]
    return list(found_people)

def calculate_balances(expenses: List[Dict]) -> Dict[str, float]:
    balances = defaultdict(float)
    for expense in expenses:
        balances[expense['paid_by'].lower()] += expense['amount']
        share = expense['amount'] / len(expense['participants'])
        for p in expense['participants']:
            balances[p.lower()] -= share
    return dict(balances)

def calculate_settlements(balances: Dict[str, float]) -> List[Settlement]:
    creditors = [(p, b) for p, b in balances.items() if b > 0.01]
    debtors = [(p, -b) for p, b in balances.items() if b < -0.01]
    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)
    settlements = []
    i = j = 0
    while i < len(creditors) and j < len(debtors):
        cr_name, cr_amt = creditors[i]
        db_name, db_amt = debtors[j]
        settle_amt = min(cr_amt, db_amt)
        settlements.append(Settlement(
            from_person=db_name,
            to_person=cr_name,
            amount=round(settle_amt, 2)
        ))
        creditors[i] = (cr_name, cr_amt - settle_amt)
        debtors[j] = (db_name, db_amt - settle_amt)
        if creditors[i][1] <= 0.01: i += 1
        if debtors[j][1] <= 0.01: j += 1
    return settlements

# ======================
# ROUTES
# ======================
@api_router.get("/", response_model=APIResponse)
async def root():
    return APIResponse(success=True, data={"message": "API is running"}, message="Welcome")

@api_router.post("/expenses", response_model=APIResponse)
async def create_expense(expense_data: ExpenseCreate):
    try:
        if expense_data.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        if not expense_data.description.strip():
            raise HTTPException(status_code=400, detail="Description cannot be empty")
        
        participants = (
            [p.lower() for p in expense_data.participants]
            if expense_data.participants 
            else extract_people_from_description(expense_data.description, expense_data.paid_by)
        )
        
        if expense_data.paid_by.lower() not in participants:
            participants.append(expense_data.paid_by.lower())
            
        expense_dict = {
            "amount": expense_data.amount,
            "description": expense_data.description,
            "paid_by": expense_data.paid_by.lower(),
            "participants": participants,
            "date_created": datetime.utcnow(),
            "date_updated": datetime.utcnow()
        }
        
        result = await db.expenses.insert_one(expense_dict)
        inserted_expense = await db.expenses.find_one({"_id": result.inserted_id})
        inserted_expense['id'] = str(inserted_expense['_id'])
        del inserted_expense['_id']
        
        return APIResponse(
            success=True,
            data=inserted_expense,
            message="Expense created successfully"
        )
    except Exception as e:
        logging.error(f"Error creating expense: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/expenses", response_model=APIResponse)
async def get_expenses():
    try:
        expenses = []
        async for expense in db.expenses.find():
            expense['id'] = str(expense['_id'])
            del expense['_id']
            expenses.append(expense)
        return APIResponse(
            success=True,
            data=expenses,
            message="Expenses fetched successfully"
        )
    except Exception as e:
        logging.error(f"Error fetching expenses: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/balances", response_model=APIResponse)
async def get_balances():
    try:
        expenses = []
        async for expense in db.expenses.find():
            expense['id'] = str(expense['_id'])
            del expense['_id']
            expenses.append(expense)
        
        balances = calculate_balances(expenses)
        balance_list = [Balance(person=p, balance=round(b, 2)).dict() for p, b in balances.items()]
        
        return APIResponse(
            success=True,
            data=balance_list,
            message="Balances calculated successfully"
        )
    except Exception as e:
        logging.error(f"Error calculating balances: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/settlements", response_model=APIResponse)
async def get_settlements():
    try:
        expenses = []
        async for expense in db.expenses.find():
            expenses.append(expense)
        
        balances = calculate_balances(expenses)
        settlements = calculate_settlements(balances)
        
        return APIResponse(
            success=True,
            data=[s.dict() for s in settlements],
            message="Settlements calculated successfully"
        )
    except Exception as e:
        logging.error(f"Error calculating settlements: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/people", response_model=APIResponse)
async def get_people():
    try:
        people = set()
        async for expense in db.expenses.find():
            people.add(expense['paid_by'])
            people.update(expense.get('participants', []))
        
        return APIResponse(
            success=True,
            data=sorted(list(people)),
            message="People fetched successfully"
        )
    except Exception as e:
        logging.error(f"Error fetching people: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/expenses/{expense_id}", response_model=APIResponse)
async def delete_expense(expense_id: str):
    try:
        # Validate the ID format
        try:
            obj_id = ObjectId(expense_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid ID format")
            
        # Delete the document
        result = await db.expenses.delete_one({"_id": obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
            
        return APIResponse(
            success=True,
            data={"id": expense_id},
            message="Expense deleted successfully"
        )
    except Exception as e:
        logging.error(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logging.info("Starting application...")
    yield
    # Shutdown
    logging.info("Shutting down application...")
    client.close()

# Create FastAPI app
app = FastAPI(
    title="Splitwise Clone API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)