# Dokumentasi Sistem POS - Flow & Clean Code Architecture

## 📋 Overview

Sistem POS (Point of Sale) full-stack dengan:
- **Backend**: Golang (REST API)
- **Frontend**: React JS
- **Database**: PostgreSQL
- **Philosophy**: Clean Code seperti Laravel dengan prinsip SOLID

---

## 🏗️ ARCHITECTURE FLOW

### 1. REQUEST FLOW (Frontend → Backend)

```
User Interaction
    ↓
React Component
    ↓
Dispatch Action (Redux/Zustand)
    ↓
API Call (Axios/Fetch)
    ↓
HTTP Request ke Backend
    ↓
Golang Router
    ↓
Middleware (Auth, Validation, Logging)
    ↓
Handler/Controller
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Database)
    ↓
Database Query
    ↓
Response → Frontend
```

### 2. COMPLETE TRANSACTION FLOW

```
┌─────────────────────────────────────────────────────────┐
│              CUSTOMER TRANSACTION FLOW                  │
└─────────────────────────────────────────────────────────┘

START
  ↓
[LOGIN] - User (Cashier) Login
  ├─ Validate credentials
  ├─ Generate JWT Token
  └─ Return user permissions
  ↓
[PRODUCT SEARCH] - Display Products & Stock
  ├─ Get all products with categories
  ├─ Filter by category/search keyword
  └─ Show real-time stock
  ↓
[ADD TO CART] - Add Items to Cart
  ├─ Check stock availability
  ├─ Validate quantity
  ├─ Store in frontend state
  └─ Calculate subtotal & discount
  ↓
[APPLY DISCOUNT] - Optional Discount/Promo
  ├─ Validate coupon/promo
  ├─ Calculate final price
  └─ Apply to transaction
  ↓
[PAYMENT METHOD] - Select Payment Method
  ├─ Cash
  ├─ Card/EDC
  ├─ Digital Wallet
  ├─ Check/Transfer
  └─ Cicilan
  ↓
[PROCESS PAYMENT] - Submit Transaction
  ├─ Create order in backend
  ├─ Reduce stock/inventory
  ├─ Record transaction details
  ├─ Process payment (integrate with payment gateway)
  └─ Generate receipt
  ↓
[PAYMENT SUCCESS] - Confirm & Print
  ├─ Print receipt (thermal printer)
  ├─ Send to customer email (optional)
  ├─ Update dashboard
  └─ Clear cart
  ↓
END

PARALLEL TASKS:
├─ Update inventory in real-time
├─ Log transaction in accounting
├─ Update customer loyalty points
└─ Sync to cloud/backup
```

---

## 🧹 CLEAN CODE PRINCIPLES (Laravel-Inspired)

### A. SERVICE LAYER PATTERN

**Tujuan**: Separation of concerns - business logic terpisah dari HTTP layer

```
Handler (Controller)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database
```

**Golang Implementation**:

```go
// ❌ BAD - Logic di Controller
func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
    var req CreateProductRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    // Business logic di sini ❌
    if req.Price < 0 {
        http.Error(w, "Invalid price", http.StatusBadRequest)
        return
    }
    
    // Database di sini ❌
    db.Exec("INSERT INTO products ...")
}

// ✅ GOOD - Logic di Service
type ProductService interface {
    CreateProduct(ctx context.Context, req *CreateProductRequest) (*Product, error)
    ValidateProduct(req *CreateProductRequest) error
}

type ProductHandler struct {
    service ProductService
}

func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
    var req CreateProductRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    // Delegate ke service
    product, err := h.service.CreateProduct(r.Context(), &req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    json.NewEncoder(w).Encode(product)
}

// Service implementation
type productService struct {
    repo ProductRepository
}

func (s *productService) CreateProduct(ctx context.Context, req *CreateProductRequest) (*Product, error) {
    // Validasi
    if err := s.ValidateProduct(req); err != nil {
        return nil, err
    }
    
    // Business logic
    product := &Product{
        Name:     req.Name,
        Price:    req.Price,
        SKU:      GenerateSKU(req.Name),
        CreatedAt: time.Now(),
    }
    
    // Simpan via repository
    return s.repo.Create(ctx, product)
}

func (s *productService) ValidateProduct(req *CreateProductRequest) error {
    if req.Name == "" {
        return errors.New("product name required")
    }
    if req.Price < 0 {
        return errors.New("price cannot be negative")
    }
    if len(req.SKU) > 50 {
        return errors.New("SKU too long")
    }
    return nil
}
```

### B. REPOSITORY PATTERN

**Tujuan**: Isolasi database logic - mudah di-test & di-swap

```go
// ❌ BAD - Raw SQL di service
func (s *productService) GetProduct(id string) (*Product, error) {
    var product Product
    err := db.QueryRow("SELECT * FROM products WHERE id = ?", id).Scan(&product.ID, &product.Name)
    return &product, err
}

// ✅ GOOD - Repository abstraction
type ProductRepository interface {
    GetByID(ctx context.Context, id string) (*Product, error)
    GetAll(ctx context.Context) ([]*Product, error)
    Create(ctx context.Context, product *Product) (*Product, error)
    Update(ctx context.Context, product *Product) error
    Delete(ctx context.Context, id string) error
}

type productRepository struct {
    db *sql.DB
}

func (r *productRepository) GetByID(ctx context.Context, id string) (*Product, error) {
    var product Product
    err := r.db.QueryRowContext(ctx, 
        "SELECT id, name, price, sku, stock, created_at FROM products WHERE id = ? AND deleted_at IS NULL", 
        id).
        Scan(&product.ID, &product.Name, &product.Price, &product.SKU, &product.Stock, &product.CreatedAt)
    
    if err == sql.ErrNoRows {
        return nil, errors.New("product not found")
    }
    return &product, err
}

// Service tetap clean - tidak tahu implementasi repository
type productService struct {
    repo ProductRepository  // Dependency injection
}
```

### C. DEPENDENCY INJECTION

**Tujuan**: Loose coupling, mudah testing

```go
// ❌ BAD - Hard-coded dependencies
type ProductHandler struct {}

func NewProductHandler() *ProductHandler {
    db := sql.Open(...) // Hard-coded
    return &ProductHandler{}
}

// ✅ GOOD - Inject dependencies
type ProductHandler struct {
    service ProductService
    logger  Logger
}

func NewProductHandler(service ProductService, logger Logger) *ProductHandler {
    return &ProductHandler{
        service: service,
        logger:  logger,
    }
}

// Di main.go - setup semua dependencies
func main() {
    // Setup database
    db := setupDatabase()
    
    // Setup repositories
    productRepo := product.NewRepository(db)
    
    // Setup services
    productService := product.NewService(productRepo)
    
    // Setup handlers
    productHandler := product.NewHandler(productService, logger)
    
    // Register routes
    router.HandleFunc("POST /api/products", productHandler.Create)
}
```

### D. ERROR HANDLING (Consistent Pattern)

```go
// ❌ BAD - Error handling inconsistent
if err != nil {
    log.Print(err)
    w.WriteHeader(500)
    return
}

// ✅ GOOD - Custom error types
type ErrorCode string

const (
    ErrProductNotFound    ErrorCode = "PRODUCT_NOT_FOUND"
    ErrInvalidPrice       ErrorCode = "INVALID_PRICE"
    ErrInsufficientStock  ErrorCode = "INSUFFICIENT_STOCK"
    ErrUnauthorized       ErrorCode = "UNAUTHORIZED"
)

type APIError struct {
    Code    ErrorCode   `json:"code"`
    Message string      `json:"message"`
    Status  int         `json:"-"`
}

// Middleware untuk handle error
func errorHandler(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                if apiErr, ok := err.(*APIError); ok {
                    w.WriteHeader(apiErr.Status)
                    json.NewEncoder(w).Encode(apiErr)
                } else {
                    w.WriteHeader(http.StatusInternalServerError)
                    json.NewEncoder(w).Encode(&APIError{
                        Code:    "INTERNAL_ERROR",
                        Message: "Internal server error",
                        Status:  500,
                    })
                }
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// Usage di service
func (s *productService) GetProduct(ctx context.Context, id string) (*Product, error) {
    product, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, &APIError{
            Code:    ErrProductNotFound,
            Message: fmt.Sprintf("Product with ID %s not found", id),
            Status:  http.StatusNotFound,
        }
    }
    return product, nil
}
```

### E. VALIDATION LAYER

```go
// ❌ BAD - Validasi bertebaran di service
func (s *productService) CreateProduct(req *CreateProductRequest) (*Product, error) {
    if req.Name == "" { return nil, errors.New("name required") }
    if req.Price < 0 { return nil, errors.New("price invalid") }
    if req.Stock < 0 { return nil, errors.New("stock invalid") }
    // ... more validation
}

// ✅ GOOD - Validator interface
type Validator interface {
    Validate(data interface{}) error
}

type CreateProductValidator struct{}

func (v *CreateProductValidator) Validate(data interface{}) error {
    req, ok := data.(*CreateProductRequest)
    if !ok {
        return errors.New("invalid request type")
    }
    
    if req.Name == "" {
        return &APIError{Code: "INVALID_NAME", Message: "Name required", Status: 400}
    }
    if req.Price < 0 {
        return &APIError{Code: "INVALID_PRICE", Message: "Price cannot be negative", Status: 400}
    }
    if req.Stock < 0 {
        return &APIError{Code: "INVALID_STOCK", Message: "Stock cannot be negative", Status: 400}
    }
    
    return nil
}

// Handler use validator
func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
    var req CreateProductRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    validator := &CreateProductValidator{}
    if err := validator.Validate(&req); err != nil {
        if apiErr, ok := err.(*APIError); ok {
            w.WriteHeader(apiErr.Status)
            json.NewEncoder(w).Encode(apiErr)
            return
        }
    }
    
    product, err := h.service.CreateProduct(r.Context(), &req)
    // ...
}
```

### F. MIDDLEWARE PATTERN

```go
// ✅ Consistent middleware pattern
func authenticateMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        
        user, err := validateToken(token)
        if err != nil {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        
        // Store user in context
        ctx := context.WithValue(r.Context(), "user", user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        next.ServeHTTP(w, r)
        
        duration := time.Since(start)
        log.Printf("%s %s took %v", r.Method, r.RequestURI, duration)
    })
}

// Chain middleware
func chainMiddleware(handler http.Handler, middlewares ...func(http.Handler) http.Handler) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        handler = middlewares[i](handler)
    }
    return handler
}

// Usage
router.Handle("POST /api/products", 
    chainMiddleware(
        productHandler,
        authenticateMiddleware,
        loggingMiddleware,
    ),
)
```

---

## 🎯 FEATURE MODULES FLOW

### A. AUTHENTICATION FLOW

```
Login Request
    ↓
Handler receives credentials
    ↓
Service validates credentials (bcrypt compare)
    ↓
Generate JWT token (RS256 or HS256)
    ↓
Store refresh token in DB
    ↓
Return access token + refresh token
    ↓
Frontend stores in localStorage (SECURE)
    ↓
Include in Authorization header for next requests
```

**Golang Service**:
```go
type AuthService interface {
    Login(ctx context.Context, email, password string) (*LoginResponse, error)
    RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error)
    ValidateToken(token string) (*User, error)
}

type LoginResponse struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int    `json:"expires_in"`
    User         *User  `json:"user"`
}
```

### B. PRODUCT MANAGEMENT FLOW

```
Product List
    ├─ Get all products (paginated, filterable)
    ├─ Filter by category/search
    └─ Show real-time stock

Add/Edit Product
    ├─ Validate input (name, price, stock, SKU)
    ├─ Check SKU uniqueness
    ├─ Handle image upload
    ├─ Save variant/attribute (if complex product)
    └─ Update cache

Stock Management
    ├─ Track stock history
    ├─ Alert low stock
    ├─ Support batch import
    └─ Reconciliation
```

### C. ORDER/TRANSACTION FLOW

```
Create Order
    ├─ Validate items exist & stock available
    ├─ Calculate subtotal
    ├─ Apply discount/tax
    ├─ Create order record
    ├─ Lock stock
    ├─ Process payment
    ├─ Update inventory
    ├─ Generate receipt
    └─ Commit transaction (or rollback)

Order Status
    ├─ Pending (before payment)
    ├─ Completed (payment success)
    ├─ Refunded (cancel/return)
    └─ History & tracking
```

### D. PAYMENT FLOW

```
Payment Methods Supported:
    ├─ CASH
    │   ├─ Calculate change
    │   ├─ Confirm payment
    │   └─ Complete order
    │
    ├─ CARD/EDC
    │   ├─ Integrate with payment gateway (Midtrans/Xendit)
    │   ├─ Handle callback
    │   ├─ Verify signature
    │   └─ Update order status
    │
    └─ DIGITAL WALLET
        ├─ QR payment (QRIS)
        ├─ E-wallet (Dana, OVO, etc)
        └─ Handle async confirmation
```

---

## 💻 REACT FRONTEND CLEAN CODE

### A. Component Structure

```javascript
// ❌ BAD - Fat component
function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        // Fetch logic mixed with component
        fetch('/api/products')
            .then(r => r.json())
            .then(data => {
                // Complex data transformation
                const processed = data.map(...)
                setProducts(processed);
            })
    }, [])
    
    return (
        // JSX mixed with business logic
        <div>
            {products.map(p => (
                <div key={p.id}>
                    <h3>{p.name}</h3>
                    {/* More JSX */}
                </div>
            ))}
        </div>
    )
}

// ✅ GOOD - Separated concerns
// services/productService.js
export const productService = {
    getAll: async () => {
        const res = await fetch('/api/products');
        return res.json();
    },
    
    getById: async (id) => {
        const res = await fetch(`/api/products/${id}`);
        return res.json();
    },
    
    create: async (data) => {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
};

// hooks/useProducts.js - Custom hook untuk logic
export function useProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await productService.getAll();
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchProducts();
    }, []);
    
    return { products, loading, error };
}

// components/ProductList.jsx - Clean component
function ProductList() {
    const { products, loading, error } = useProducts();
    
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    
    return (
        <div className="product-list">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
```

### B. State Management (Redux/Zustand)

```javascript
// ✅ GOOD - Redux Toolkit pattern
// store/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../services/productService';

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            return await productService.getAll();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const productSlice = createSlice({
    name: 'products',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default productSlice.reducer;

// ✅ GOOD - Zustand pattern (lebih simple)
// store/useProductStore.js
import create from 'zustand';

export const useProductStore = create((set) => ({
    products: [],
    loading: false,
    error: null,
    
    fetchProducts: async () => {
        set({ loading: true });
        try {
            const data = await productService.getAll();
            set({ products: data, error: null });
        } catch (error) {
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },
    
    addProduct: (product) => set((state) => ({
        products: [...state.products, product],
    })),
}));
```

### C. API Request Handler

```javascript
// services/apiClient.js
const API_BASE_URL = process.env.REACT_APP_API_URL;

export const apiClient = {
    async request(method, endpoint, data = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const options = {
            method,
            headers,
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            
            // Handle 401 - refresh token or redirect to login
            if (response.status === 401) {
                // Trigger logout or token refresh
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Request failed');
            }
            
            return result;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    },
    
    get: (endpoint) => apiClient.request('GET', endpoint),
    post: (endpoint, data) => apiClient.request('POST', endpoint, data),
    put: (endpoint, data) => apiClient.request('PUT', endpoint, data),
    delete: (endpoint) => apiClient.request('DELETE', endpoint),
};
```

### D. Reusable Components

```javascript
// components/common/Button.jsx - Single responsibility
function Button({ 
    label, 
    onClick, 
    disabled = false, 
    variant = 'primary',
    loading = false,
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn btn-${variant}`}
        >
            {loading ? <Spinner /> : label}
        </button>
    );
}

// components/common/Input.jsx
function Input({
    label,
    name,
    value,
    onChange,
    error,
    type = 'text',
    required = false,
}) {
    return (
        <div className="form-group">
            {label && <label htmlFor={name}>{label}</label>}
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className={error ? 'input-error' : ''}
            />
            {error && <span className="error-text">{error}</span>}
        </div>
    );
}

// Menggunakan reusable components
function LoginForm() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const result = await apiClient.post('/auth/login', formData);
            localStorage.setItem('access_token', result.access_token);
            // Redirect to dashboard
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <Input
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
            />
            <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
            />
            <Button
                label="Login"
                onClick={handleSubmit}
                loading={loading}
                disabled={!formData.email || !formData.password}
            />
        </form>
    );
}
```

---

## 🗄️ DATABASE SCHEMA OVERVIEW

```sql
-- USERS & AUTH
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'CASHIER', 'MANAGER') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID,
    price DECIMAL(15, 2) NOT NULL,
    cost DECIMAL(15, 2),
    stock INT DEFAULT 0,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- ORDERS/TRANSACTIONS
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    payment_method ENUM('CASH', 'CARD', 'WALLET') NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    order_status ENUM('PENDING', 'COMPLETED', 'REFUNDED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📝 CODE STANDARDS & CONVENTIONS

### Golang

```go
// 1. Naming Convention
- Package: lowercase, single word
- Functions: CamelCase, exported (Public)
- Variables: camelCase or _private
- Constants: CONSTANT_CASE

// 2. Error handling
func doSomething() (result, error) {
    if err != nil {
        return nil, fmt.Errorf("failed to do something: %w", err)
    }
}

// 3. Context usage
func (s *service) GetData(ctx context.Context) (Data, error) {
    // Always respect context timeout/cancellation
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    default:
    }
}

// 4. Interface segregation
type Reader interface {
    Read(ctx context.Context) (Data, error)
}

type Writer interface {
    Write(ctx context.Context, data Data) error
}

// Better than Reader, Writer menjadi satu interface besar

// 5. File structure
project/
├── main.go
├── config/
│   └── config.go
├── internal/
│   ├── domain/
│   │   ├── product.go
│   │   └── order.go
│   ├── service/
│   │   ├── product_service.go
│   │   └── order_service.go
│   ├── repository/
│   │   ├── product_repository.go
│   │   └── order_repository.go
│   ├── handler/
│   │   ├── product_handler.go
│   │   └── order_handler.go
│   └── middleware/
│       ├── auth.go
│       └── logging.go
├── pkg/
│   ├── database/
│   ├── jwt/
│   └── logger/
└── database/
    └── migrations/
```

### React/JavaScript

```javascript
// 1. File naming
- Components: PascalCase.jsx
- Services: camelCase.js
- Hooks: useHookName.js
- Styles: component.module.css

// 2. Component structure
function ComponentName({
    prop1,
    prop2,
    onEvent,
}) {
    // Hooks
    const [state, setState] = useState();
    
    // Effects
    useEffect(() => {
        // Side effects
    }, []);
    
    // Handlers
    const handleClick = () => {
        // Handle click
    };
    
    // Render
    return <div>Content</div>;
}

// 3. Always use PropTypes or TypeScript
ComponentName.propTypes = {
    prop1: PropTypes.string.isRequired,
    prop2: PropTypes.number,
    onEvent: PropTypes.func.isRequired,
};

// Or with TypeScript
interface ComponentProps {
    prop1: string;
    prop2?: number;
    onEvent: (data: any) => void;
}

// 4. Avoid prop drilling - use Context + Custom hooks
const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    
    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
}

// 5. Directory structure
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── Modal.jsx
│   ├── Product/
│   │   ├── ProductList.jsx
│   │   ├── ProductForm.jsx
│   │   └── ProductCard.jsx
│   └── Order/
│       ├── OrderList.jsx
│       └── OrderDetail.jsx
├── hooks/
│   ├── useProducts.js
│   ├── useOrders.js
│   └── useAuth.js
├── services/
│   ├── apiClient.js
│   ├── productService.js
│   ├── orderService.js
│   └── authService.js
├── store/
│   ├── productSlice.js
│   ├── orderSlice.js
│   └── store.js
├── context/
│   └── UserContext.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Orders.jsx
│   └── Login.jsx
├── styles/
│   ├── App.css
│   └── global.css
└── App.jsx
```

---

## 🔐 SECURITY BEST PRACTICES

### Backend (Golang)

```go
// 1. Input validation & sanitization
import "html"

func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
    var req CreateProductRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    // Sanitize input
    req.Name = html.EscapeString(strings.TrimSpace(req.Name))
    
    // Validate
    if len(req.Name) < 3 {
        http.Error(w, "Name too short", http.StatusBadRequest)
        return
    }
}

// 2. SQL Injection prevention - ALWAYS use parameterized queries
// ❌ BAD
db.Query(fmt.Sprintf("SELECT * FROM products WHERE name = '%s'", name))

// ✅ GOOD
db.Query("SELECT * FROM products WHERE name = $1", name)

// 3. Password hashing
import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
    return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

func ComparePassword(hash, password string) bool {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// 4. JWT tokens - use secure signing
import "github.com/golang-jwt/jwt/v5"

func GenerateToken(userID string) (string, error) {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(time.Hour * 24).Unix(),
    })
    return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// 5. CORS configuration
import "github.com/rs/cors"

allowedOrigins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
c := cors.New(cors.Options{
    AllowedOrigins:   allowedOrigins,
    AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
    AllowCredentials: true,
})

router := c.Handler(router)

// 6. Rate limiting
import "golang.org/x/time/rate"

limiter := rate.NewLimiter(10, 100) // 10 req/sec, burst 100

if !limiter.Allow() {
    http.Error(w, "Too many requests", http.StatusTooManyRequests)
    return
}
```

### Frontend (React)

```javascript
// 1. XSS Prevention - never use dangerouslySetInnerHTML
// ❌ BAD
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ GOOD - React auto-escapes
<div>{userInput}</div>

// 2. CSRF Token
const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.content;
};

// Use in API calls
const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
        'X-CSRF-Token': getCsrfToken(),
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
});

// 3. Secure token storage
// ❌ BAD - vulnerable to XSS
localStorage.setItem('token', token);

// ✅ BETTER - httpOnly cookies (set by backend)
// Backend sets: Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict
// Frontend automatically includes in requests

// 4. Validate user input
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// 5. Environment variables
// .env
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENV=production

// Usage - never expose sensitive data
console.log(process.env.REACT_APP_API_URL); // OK
console.log(process.env.REACT_APP_SECRET);  // NEVER - undefined di frontend
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend
- [ ] Set environment variables (JWT_SECRET, DB_URL, CORS origins)
- [ ] Run database migrations
- [ ] Enable HTTPS
- [ ] Setup logging & monitoring
- [ ] Configure rate limiting
- [ ] Setup backup strategy
- [ ] Enable API documentation (Swagger/OpenAPI)

### Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Set correct API_BASE_URL untuk production
- [ ] Enable gzip compression
- [ ] Setup CDN for static assets
- [ ] Configure CSP (Content Security Policy) headers
- [ ] Setup analytics
- [ ] Test in production environment

---

## 📚 REFERENSI & TOOLS

**Backend (Golang)**
- Gin/Chi (routing)
- sqlc (type-safe SQL)
- Wire (DI container)
- Testify (testing)

**Frontend (React)**
- React Router (routing)
- Redux Toolkit / Zustand (state management)
- TailwindCSS / Material-UI (styling)
- Vitest / Jest (testing)

**Database**
- PostgreSQL
- Migrations: Flyway / sql-migrate

**DevOps**
- Docker / Docker Compose
- GitHub Actions / CI-CD
- Kubernetes (optional)

---

**Last Updated**: 2026
**Status**: Production Ready
**Author**: Fullstack Engineer Team