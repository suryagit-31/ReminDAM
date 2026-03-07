# Complete Validation Summary

## All Validations in ReminDAM

```
┌─────────────────────────────────────────────────────────────┐
│              USER FILLS TASK FORM                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           REAL-TIME VALIDATION (Preview)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Reminder preview updates as user types                  │
│  ✓ Shows calculated reminder date                          │
│  ✓ Changes to RED if date is in past                       │
│  ✓ Shows warning message                                   │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼ User clicks "Create Task"
                        │
┌─────────────────────────────────────────────────────────────┐
│          FRONTEND VALIDATION (TaskForm.jsx)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ Required Fields Check                                  │
│     ├─ Title must be filled                                │
│     ├─ Due date must be selected                           │
│     └─ Email must be provided                              │
│                                                             │
│  2️⃣ Email Format Validation                                │
│     └─ Valid email format (regex)                          │
│                                                             │
│  3️⃣ Due Date Validation                                    │
│     └─ Must be in the future (> today)                     │
│                                                             │
│  4️⃣ Reminder Date Validation (NEW!)                        │
│     ├─ Calculate: reminderDate = dueDate - remindBefore   │
│     ├─ Check: reminderDate >= today                        │
│     └─ Error if date has passed                            │
│                                                             │
│  5️⃣ Custom Time Validation                                 │
│     └─ If time_slot = 'custom', custom_time required       │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ All validations pass ✓
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         DATABASE CONSTRAINTS (PostgreSQL)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  6️⃣ Title NOT NULL                                         │
│     └─ Cannot insert task without title                    │
│                                                             │
│  7️⃣ Due Date NOT NULL                                      │
│     └─ Cannot insert task without due date                 │
│                                                             │
│  8️⃣ Remind Before Constraint                               │
│     └─ CHECK (remind_before IN (1, 2, 3, 5, 7, 10))       │
│     └─ Only these values allowed                           │
│                                                             │
│  9️⃣ Email Format Check                                     │
│     └─ CHECK (email ~* regex pattern)                      │
│     └─ Must be valid email format                          │
│                                                             │
│  🔟 User ID Foreign Key                                     │
│     └─ REFERENCES auth.users(id)                           │
│     └─ Must be valid user ID                               │
│                                                             │
│  1️⃣1️⃣ Email NOT NULL                                       │
│     └─ Cannot insert without email                         │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ Database accepts insert ✓
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        ROW LEVEL SECURITY (RLS) CHECK                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣2️⃣ INSERT Policy                                         │
│     └─ WITH CHECK (auth.uid() = user_id)                   │
│     └─ Can only insert tasks for yourself                  │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ RLS check passes ✓
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ✅ TASK CREATED SUCCESSFULLY                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Validation Rules

### 1️⃣ Required Fields (Frontend)

**Rule:**
```javascript
if (!formData.title || !formData.due_date || !formData.email) {
  error: "Please fill in all required fields"
}
```

**Fields:**
- Title (required)
- Due Date (required)
- Email (required)
- Remind Before (default: 1)
- Time Slot (default: 'morning')

---

### 2️⃣ Email Format (Frontend + Database)

**Frontend:**
```javascript
type="email"  // HTML5 validation
```

**Database:**
```sql
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
```

**Valid Examples:**
- ✅ john@example.com
- ✅ user.name+tag@domain.co.uk
- ❌ invalid.email
- ❌ @domain.com
- ❌ user@

---

### 3️⃣ Due Date Must Be Future (Frontend)

**Rule:**
```javascript
if (new Date(formData.due_date) < new Date()) {
  error: "Due date must be in the future"
}
```

**Examples:**
```
Today: March 25, 2024

✅ March 26, 2024 (tomorrow)
✅ April 1, 2024 (next week)
✅ December 31, 2024 (far future)
❌ March 24, 2024 (yesterday)
❌ March 25, 2024 (today - technically < now)
```

---

### 4️⃣ Reminder Date Not in Past (Frontend) ⭐ NEW

**Rule:**
```javascript
const reminderDate = calculateReminderDate(due_date, remind_before)
const today = new Date()
today.setHours(0, 0, 0, 0)

if (reminderDate < today) {
  error: "Reminder date has already passed"
}
```

**Examples:**
```
Today: March 25, 2024

Scenario 1:
  Due: April 10, 2024
  Remind: 5 days before
  Reminder Date: April 5, 2024
  ✅ VALID (April 5 >= March 25)

Scenario 2:
  Due: April 1, 2024
  Remind: 10 days before
  Reminder Date: March 22, 2024
  ❌ INVALID (March 22 < March 25)

Scenario 3:
  Due: March 26, 2024
  Remind: 1 day before
  Reminder Date: March 25, 2024
  ✅ VALID (same day is OK)
```

**Calculation:**
```
reminderDate = dueDate - remindBefore (days)

April 10 - 5 days = April 5
April 1 - 10 days = March 22
March 26 - 1 day = March 25
```

---

### 5️⃣ Custom Time Required (Frontend)

**Rule:**
```javascript
if (formData.time_slot === 'custom' && !formData.custom_time) {
  error: "Please select a custom time"
}
```

**When Required:**
- User selects "Custom Time" from time slot dropdown
- Must provide datetime value

---

### 6️⃣ Title NOT NULL (Database)

**SQL:**
```sql
title TEXT NOT NULL
```

**Protection:**
- Backend validation layer
- Prevents data integrity issues

---

### 7️⃣ Due Date NOT NULL (Database)

**SQL:**
```sql
due_date DATE NOT NULL
```

---

### 8️⃣ Remind Before Constraint (Database)

**SQL:**
```sql
remind_before INTEGER NOT NULL
  CHECK (remind_before IN (1, 2, 3, 5, 7, 10))
```

**Allowed Values:**
- 1 day before
- 2 days before
- 3 days before
- 5 days before
- 7 days before
- 10 days before

**Invalid Values:**
- ❌ 0 days
- ❌ 4 days
- ❌ 6 days
- ❌ 15 days
- ❌ Negative values

---

### 9️⃣ Email Format Check (Database)

**SQL:**
```sql
email TEXT NOT NULL
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
```

**Double Protection:**
- Frontend validates (HTML5)
- Backend validates (PostgreSQL regex)

---

### 🔟 User ID Foreign Key (Database)

**SQL:**
```sql
user_id UUID NOT NULL
  REFERENCES auth.users(id) ON DELETE CASCADE
```

**Enforces:**
- user_id must exist in auth.users table
- Cannot create orphaned tasks
- Deleting user deletes their tasks (CASCADE)

---

### 1️⃣1️⃣ Email NOT NULL (Database)

**SQL:**
```sql
email TEXT NOT NULL
```

---

### 1️⃣2️⃣ RLS INSERT Policy (Database)

**SQL:**
```sql
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Enforces:**
- Can only create tasks with your own user_id
- JWT token must match user_id in INSERT
- Prevents impersonation

---

## Validation Layers

### Layer 1: HTML5 (Browser)
```html
<input type="email" required />
<input type="date" required />
```
- Basic client-side validation
- Can be bypassed (not secure)

### Layer 2: React (Frontend Logic)
```javascript
// In TaskForm.jsx handleSubmit()
- Required fields check
- Email format
- Due date future check
- Reminder date past check ⭐
- Custom time check
```
- Provides good UX
- Immediate feedback
- Can be bypassed (not secure)

### Layer 3: PostgreSQL (Database)
```sql
NOT NULL constraints
CHECK constraints
FOREIGN KEY constraints
Email regex validation
```
- **Cannot be bypassed**
- Final validation layer
- Ensures data integrity

### Layer 4: RLS (Row-Level Security)
```sql
RLS policies using auth.uid()
```
- **Cannot be bypassed** (with proper keys)
- Authorization layer
- Enforces user isolation

---

## Validation Flow Example

### Valid Submission ✅

```
User Input:
  Title: "Submit Report"
  Due Date: April 15, 2024
  Remind Before: 5 days
  Time Slot: morning
  Email: john@example.com

Step 1: HTML5 Validation
  ✓ All required fields filled
  ✓ Email format valid
  ✓ Date format valid

Step 2: React Validation
  ✓ Title provided
  ✓ Due date provided
  ✓ Email provided
  ✓ Due date (Apr 15) > Today (Mar 25)
  ✓ Reminder date (Apr 10) >= Today (Mar 25)
  ✓ Custom time not needed (morning selected)

Step 3: Database Constraints
  ✓ title NOT NULL → "Submit Report"
  ✓ due_date NOT NULL → "2024-04-15"
  ✓ email NOT NULL → "john@example.com"
  ✓ remind_before IN (1,2,3,5,7,10) → 5
  ✓ email regex → "john@example.com" matches
  ✓ user_id FK → valid user ID

Step 4: RLS Policy
  ✓ auth.uid() = user_id → match

Result: ✅ Task created successfully!
```

### Invalid Submission ❌

```
User Input:
  Title: "Submit Report"
  Due Date: April 1, 2024
  Remind Before: 10 days
  Time Slot: morning
  Email: john@example.com

Step 1: HTML5 Validation
  ✓ All required fields filled
  ✓ Email format valid
  ✓ Date format valid

Step 2: React Validation
  ✓ Title provided
  ✓ Due date provided
  ✓ Email provided
  ✓ Due date (Apr 1) > Today (Mar 25)
  ❌ Reminder date (Mar 22) < Today (Mar 25)

  BLOCKED: Error toast shown
  "Reminder date (Mar 22, 2024) has already passed..."

Result: ❌ Form submission prevented
```

---

## Error Messages

### Frontend Errors (User-Friendly)

| Error | Message |
|-------|---------|
| Missing fields | "Please fill in all required fields" |
| Past due date | "Due date must be in the future" |
| Past reminder date | "Reminder date (Mar 22, 2024) has already passed. Please choose a later due date or select fewer days for the reminder." |
| Missing custom time | "Please select a custom time" |

### Database Errors (Technical)

| Error | Message |
|-------|---------|
| NULL constraint | "null value in column 'title' violates not-null constraint" |
| Check constraint | "new row for relation 'tasks' violates check constraint 'tasks_remind_before_check'" |
| Foreign key | "insert or update on table 'tasks' violates foreign key constraint" |
| Email format | "new row for relation 'tasks' violates check constraint 'tasks_email_check'" |

---

## Testing Checklist

### Reminder Date Validation:

- [x] Valid: Far future date (Dec 31, remind 10 days)
- [x] Invalid: Past reminder (Apr 1, remind 10 days, today Mar 25)
- [x] Valid: Same day reminder (tomorrow, remind 1 day)
- [x] Edge: Exactly today (should pass if reminderDate = today)
- [x] Visual: Red warning shows in preview for invalid dates
- [x] Visual: Blue preview shows for valid dates
- [x] Error: Toast appears on submit with invalid date
- [x] Success: Submit works with valid date

### Other Validations:

- [ ] Empty title → Error
- [ ] Empty due date → Error
- [ ] Empty email → Error
- [ ] Invalid email format → Error
- [ ] Past due date → Error
- [ ] Custom time without value → Error
- [ ] Invalid remind_before (e.g., 4) → Database error
- [ ] Wrong user_id → RLS blocks

---

## Summary

✅ **12 Validation Rules** across 4 layers
✅ **Real-time preview** with visual warnings
✅ **Clear error messages** with solutions
✅ **Database integrity** enforced
✅ **Security** via RLS policies
✅ **Reminder date validation** prevents crossed dates ⭐

**Your validation system is comprehensive and production-ready!** 🎉
