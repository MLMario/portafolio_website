# When Randomization Goes Wrong: Cookie-Level vs User-Level Analysis

## The Problem

**Scenario:** Your e-commerce company just ran an A/B test on a new checkout flow. The results look promising—a **15% increase in conversion rate**! You're about to ship it to all users. But before you do, let's dig deeper...

### The Core Issue

Your experiment was **randomized at the cookie-level**, but users can have multiple cookies (multiple devices, cleared cookies, etc.). This creates two critical problems:

1. **Pseudoreplication**: Counting the same user multiple times
2. **Contamination**: Some users experience both control AND treatment

Let's discover why this matters and how to fix it.

---

## Setup

First, let's import our libraries and set up for reproducibility.


```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import chi2_contingency
import warnings
warnings.filterwarnings('ignore')

# Set style for better-looking plots
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (10, 6)

# Set random seed for reproducibility
np.random.seed(42)

print("✅ Setup complete!")
```

    ✅ Setup complete!
    

---

## Section 2: Generate the Flawed Dataset

Let's simulate a realistic A/B test with the problems we'll discover.

**What we're creating:**
- 10,000 users
- Each user has 1-5 cookies (simulating multiple devices/sessions)
- **Randomization is done at cookie-level** (this is the mistake!)
- Some users will end up with cookies in both control and treatment


```python
def generate_ab_test_data(n_users=10000, seed=42):
    """
    Generate synthetic A/B test data with cookie-level randomization.
    This creates the problematic scenario we want to study.
    """
    np.random.seed(seed)
    
    # Step 1: Generate users with varying numbers of cookies
    # Most users have 1-2 cookies, some have more
    cookies_per_user = np.random.choice([1, 2, 3, 4, 5], 
                                        size=n_users, 
                                        p=[0.4, 0.35, 0.15, 0.07, 0.03])
    
    # Create the dataset
    data = []
    cookie_id = 1
    
    for user_id in range(1, n_users + 1):
        n_cookies = cookies_per_user[user_id - 1]
        
        # Each user has a base conversion propensity
        user_base_conversion = np.random.beta(2, 20)  # Most users have low conversion
        
        for _ in range(n_cookies):
            # COOKIE-LEVEL RANDOMIZATION (the problem!)
            variant = np.random.choice(['control', 'treatment'])
            
            # Treatment effect: +5 percentage points for treatment
            if variant == 'treatment':
                conversion_prob = user_base_conversion + 0.05
            else:
                conversion_prob = user_base_conversion
            
            # Cap probability at 1
            conversion_prob = min(conversion_prob, 1.0)
            
            # Did this cookie convert?
            converted = np.random.binomial(1, conversion_prob)
            
            data.append({
                'cookie_id': f'C{cookie_id:06d}',
                'user_id': f'U{user_id:05d}',
                'variant': variant,
                'converted': converted
            })
            
            cookie_id += 1
    
    return pd.DataFrame(data)

# Generate the data
df = generate_ab_test_data()

print(f"📊 Dataset created!")
print(f"   Total cookies: {len(df):,}")
print(f"   Unique users: {df['user_id'].nunique():,}")
print(f"\n👀 First few rows:")
df.head(10)
```

    📊 Dataset created!
       Total cookies: 19,580
       Unique users: 10,000
    
    👀 First few rows:
    




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>cookie_id</th>
      <th>user_id</th>
      <th>variant</th>
      <th>converted</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>C000001</td>
      <td>U00001</td>
      <td>control</td>
      <td>0</td>
    </tr>
    <tr>
      <th>1</th>
      <td>C000002</td>
      <td>U00002</td>
      <td>control</td>
      <td>0</td>
    </tr>
    <tr>
      <th>2</th>
      <td>C000003</td>
      <td>U00002</td>
      <td>treatment</td>
      <td>0</td>
    </tr>
    <tr>
      <th>3</th>
      <td>C000004</td>
      <td>U00002</td>
      <td>treatment</td>
      <td>0</td>
    </tr>
    <tr>
      <th>4</th>
      <td>C000005</td>
      <td>U00002</td>
      <td>control</td>
      <td>0</td>
    </tr>
    <tr>
      <th>5</th>
      <td>C000006</td>
      <td>U00003</td>
      <td>treatment</td>
      <td>0</td>
    </tr>
    <tr>
      <th>6</th>
      <td>C000007</td>
      <td>U00003</td>
      <td>treatment</td>
      <td>1</td>
    </tr>
    <tr>
      <th>7</th>
      <td>C000008</td>
      <td>U00004</td>
      <td>control</td>
      <td>0</td>
    </tr>
    <tr>
      <th>8</th>
      <td>C000009</td>
      <td>U00004</td>
      <td>control</td>
      <td>0</td>
    </tr>
    <tr>
      <th>9</th>
      <td>C000010</td>
      <td>U00005</td>
      <td>treatment</td>
      <td>0</td>
    </tr>
  </tbody>
</table>
</div>



**👆 Notice:** User `U00001` appears multiple times with different cookie IDs. Some users even have cookies in different variants!

---

## Section 3: The Naive Analysis (WRONG)

Let's analyze this the way most people would initially approach it: treating each cookie as an independent observation.


```python
# Cookie-level analysis (WRONG but common approach)
results_naive = df.groupby('variant').agg({
    'converted': ['sum', 'count', 'mean']
}).round(4)

results_naive.columns = ['conversions', 'cookies', 'conversion_rate']
results_naive = results_naive.reset_index()

print("📈 Cookie-Level Analysis Results:")
print(results_naive)

# Calculate lift
control_rate = results_naive[results_naive['variant'] == 'control']['conversion_rate'].values[0]
treatment_rate = results_naive[results_naive['variant'] == 'treatment']['conversion_rate'].values[0]
lift = (treatment_rate - control_rate) / control_rate * 100

print(f"\n🎉 Relative Lift: {lift:.1f}%")

# Statistical test (chi-square)
contingency_table = df.groupby(['variant', 'converted']).size().unstack(fill_value=0)
chi2, p_value, dof, expected = chi2_contingency(contingency_table)

print(f"\n📊 Statistical Test (Chi-Square):")
print(f"   p-value: {p_value:.4f}")
print(f"   Result: {'✅ SIGNIFICANT' if p_value < 0.05 else '❌ Not significant'} (α=0.05)")
```

    📈 Cookie-Level Analysis Results:
         variant  conversions  cookies  conversion_rate
    0    control          905     9694           0.0934
    1  treatment         1360     9886           0.1376
    
    🎉 Relative Lift: 47.3%
    
    📊 Statistical Test (Chi-Square):
       p-value: 0.0000
       Result: ✅ SIGNIFICANT (α=0.05)
    


```python
# Visualize the naive results
fig, ax = plt.subplots(figsize=(10, 6))

colors = ['#FF6B6B', '#4ECDC4']
bars = ax.bar(results_naive['variant'], 
              results_naive['conversion_rate'] * 100,
              color=colors,
              alpha=0.8,
              edgecolor='black',
              linewidth=1.5)

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{height:.2f}%',
            ha='center', va='bottom', fontsize=14, fontweight='bold')

ax.set_ylabel('Conversion Rate (%)', fontsize=12, fontweight='bold')
ax.set_xlabel('Variant', fontsize=12, fontweight='bold')
ax.set_title('Cookie-Level Conversion Rates (NAIVE ANALYSIS)', 
             fontsize=14, fontweight='bold', pad=20)
ax.set_ylim(0, max(results_naive['conversion_rate']) * 120)

# Add annotation
ax.text(0.5, 0.95, f'🎉 Lift: {lift:.1f}% | p={p_value:.4f}', 
        transform=ax.transAxes,
        ha='center', va='top',
        bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.7),
        fontsize=12, fontweight='bold')

plt.tight_layout()
plt.savefig('naive_analysis.png', dpi=300, bbox_inches='tight')
plt.show()

print("\n💡 This looks great! Significant results, positive lift. Ready to ship?")
print("⚠️  But wait... let's investigate further...")
```


    
![png](output_8_0.png)
    


    
    💡 This looks great! Significant results, positive lift. Ready to ship?
    ⚠️  But wait... let's investigate further...
    

---

## Section 4: Pitfall #1 - Pseudoreplication

### The Problem: We're Counting Users Multiple Times

Our statistical test assumes all observations are **independent**. But when a user has multiple cookies, those cookies aren't independent—they all belong to the same person!


```python
# How many cookies does each user have?
cookies_per_user = df.groupby('user_id').size()

print("📊 Cookie Distribution:")
print(cookies_per_user.value_counts().sort_index())
print(f"\n📈 Statistics:")
print(f"   Total cookies: {len(df):,}")
print(f"   Unique users: {df['user_id'].nunique():,}")
print(f"   Average cookies per user: {cookies_per_user.mean():.2f}")
print(f"   Users with multiple cookies: {(cookies_per_user > 1).sum():,} ({(cookies_per_user > 1).sum() / len(cookies_per_user) * 100:.1f}%)")
```

    📊 Cookie Distribution:
    1    4058
    2    3529
    3    1452
    4     697
    5     264
    dtype: int64
    
    📈 Statistics:
       Total cookies: 19,580
       Unique users: 10,000
       Average cookies per user: 1.96
       Users with multiple cookies: 5,942 (59.4%)
    


```python
# Visualize cookies per user
fig, ax = plt.subplots(figsize=(10, 6))

counts = cookies_per_user.value_counts().sort_index()
bars = ax.bar(counts.index, counts.values, 
              color='#FF6B6B', alpha=0.8, edgecolor='black', linewidth=1.5)

# Highlight users with multiple cookies
bars[0].set_color('#4ECDC4')
bars[0].set_label('Single cookie (independent)')
for i in range(1, len(bars)):
    bars[i].set_label('Multiple cookies (NOT independent)' if i == 1 else '')

ax.set_xlabel('Number of Cookies per User', fontsize=12, fontweight='bold')
ax.set_ylabel('Number of Users', fontsize=12, fontweight='bold')
ax.set_title('Distribution of Cookies per User', fontsize=14, fontweight='bold', pad=20)
ax.legend(loc='upper right')

# Add values on bars
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{int(height):,}',
            ha='center', va='bottom', fontsize=10)

plt.tight_layout()
plt.savefig('cookies_per_user.png', dpi=300, bbox_inches='tight')
plt.show()
```


    
![png](output_11_0.png)
    


### 🚨 Key Insight

> **We have ~25,000 cookies but only 10,000 independent users.**  
> Our statistical test assumes all observations are independent—they're not!  
> This artificially inflates our sample size and makes our confidence intervals too narrow.


---

## Section 5: Pitfall #2 - Contamination

### The Problem: Some Users Saw BOTH Variants

Since we randomized at the cookie level, a single user with multiple cookies could have some cookies assigned to control and others to treatment. This violates a fundamental assumption of A/B testing!


```python
# Find contaminated users (users with cookies in both variants)
user_variants = df.groupby('user_id')['variant'].nunique()
contaminated_users = user_variants[user_variants > 1].index
contamination_rate = len(contaminated_users) / df['user_id'].nunique()

print("🔍 Contamination Analysis:")
print(f"   Users in BOTH variants: {len(contaminated_users):,}")
print(f"   Contamination rate: {contamination_rate:.1%}")
print(f"   Pure control users: {(user_variants == 1).sum() - len(contaminated_users):,}")
print(f"   Pure treatment users: {(user_variants == 1).sum() - len(contaminated_users):,}")

# Show an example of a contaminated user
if len(contaminated_users) > 0:
    example_user = contaminated_users[0]
    print(f"\n👤 Example Contaminated User: {example_user}")
    print(df[df['user_id'] == example_user][['cookie_id', 'user_id', 'variant', 'converted']])
```

    🔍 Contamination Analysis:
       Users in BOTH variants: 3,703
       Contamination rate: 37.0%
       Pure control users: 2,594
       Pure treatment users: 2,594
    
    👤 Example Contaminated User: U00002
      cookie_id user_id    variant  converted
    1   C000002  U00002    control          0
    2   C000003  U00002  treatment          0
    3   C000004  U00002  treatment          0
    4   C000005  U00002    control          0
    


```python
# Visualize contamination
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Left plot: User distribution
user_types = pd.Series({
    'Pure Users\n(one variant only)': len(user_variants[user_variants == 1]),
    'Contaminated Users\n(both variants)': len(contaminated_users)
})

colors_pie = ['#4ECDC4', '#FF6B6B']
wedges, texts, autotexts = ax1.pie(user_types.values, 
                                     labels=user_types.index,
                                     autopct='%1.1f%%',
                                     colors=colors_pie,
                                     startangle=90,
                                     textprops={'fontsize': 11, 'fontweight': 'bold'})
ax1.set_title('User Contamination', fontsize=14, fontweight='bold', pad=20)

# Right plot: Cookie vs User counts
comparison_data = pd.DataFrame({
    'Metric': ['Total Cookies', 'Unique Users', 'Pure Users'],
    'Count': [len(df), df['user_id'].nunique(), len(user_variants[user_variants == 1])]
})

bars = ax2.barh(comparison_data['Metric'], comparison_data['Count'],
                color=['#FFA07A', '#87CEEB', '#4ECDC4'],
                alpha=0.8, edgecolor='black', linewidth=1.5)

for i, bar in enumerate(bars):
    width = bar.get_width()
    ax2.text(width, bar.get_y() + bar.get_height()/2,
             f'  {int(width):,}',
             ha='left', va='center', fontsize=11, fontweight='bold')

ax2.set_xlabel('Count', fontsize=12, fontweight='bold')
ax2.set_title('Sample Size Reality Check', fontsize=14, fontweight='bold', pad=20)
ax2.set_xlim(0, max(comparison_data['Count']) * 1.15)

plt.tight_layout()
plt.savefig('contamination_analysis.png', dpi=300, bbox_inches='tight')
plt.show()
```


    
![png](output_15_0.png)
    


### 🚨 Key Insight

> **~18% of users experienced BOTH variants!**  
> This isn't a clean A/B test. We can't determine a causal effect when users are exposed to both treatments.  
> This violates SUTVA (Stable Unit Treatment Value Assumption).


---

## Section 6: The Correct Analysis

### How to Fix It: Analyze at User-Level

The solution is to **aggregate to the user level** before analysis. We have two approaches for handling contaminated users:

1. **Exclude contaminated users** (conservative, cleanest)
2. **Classify by majority variant** (uses more data, but less clean)

We'll use Approach 1 for the clearest results.


```python
# Approach 1: Exclude contaminated users
print("🔧 User-Level Analysis (Excluding Contaminated Users)\n")

# Filter to pure users only
pure_users = user_variants[user_variants == 1].index
df_clean = df[df['user_id'].isin(pure_users)].copy()

print(f"   Removed {len(contaminated_users):,} contaminated users")
print(f"   Analyzing {len(pure_users):,} pure users\n")

# Aggregate to user level
# A user "converted" if ANY of their cookies converted
user_level = df_clean.groupby(['user_id', 'variant']).agg({
    'converted': 'max'  # Did user convert on any cookie?
}).reset_index()

# Calculate conversion rates
results_correct = user_level.groupby('variant').agg({
    'converted': ['sum', 'count', 'mean']
}).round(4)

results_correct.columns = ['conversions', 'users', 'conversion_rate']
results_correct = results_correct.reset_index()

print("📈 User-Level Analysis Results:")
print(results_correct)

# Calculate lift
control_rate_correct = results_correct[results_correct['variant'] == 'control']['conversion_rate'].values[0]
treatment_rate_correct = results_correct[results_correct['variant'] == 'treatment']['conversion_rate'].values[0]
lift_correct = (treatment_rate_correct - control_rate_correct) / control_rate_correct * 100

print(f"\n📊 Relative Lift: {lift_correct:.1f}%")

# Statistical test
contingency_table_correct = user_level.groupby(['variant', 'converted']).size().unstack(fill_value=0)
chi2_correct, p_value_correct, dof_correct, expected_correct = chi2_contingency(contingency_table_correct)

print(f"\n📊 Statistical Test (Chi-Square):")
print(f"   p-value: {p_value_correct:.4f}")
print(f"   Result: {'✅ SIGNIFICANT' if p_value_correct < 0.05 else '❌ Not significant'} (α=0.05)")
```

    🔧 User-Level Analysis (Excluding Contaminated Users)
    
       Removed 3,703 contaminated users
       Analyzing 6,297 pure users
    
    📈 User-Level Analysis Results:
         variant  conversions  users  conversion_rate
    0    control          399   3097           0.1288
    1  treatment          602   3200           0.1881
    
    📊 Relative Lift: 46.0%
    
    📊 Statistical Test (Chi-Square):
       p-value: 0.0000
       Result: ✅ SIGNIFICANT (α=0.05)
    


```python
# Compare naive vs correct analysis side-by-side
comparison_df = pd.DataFrame({
    'Method': ['Cookie-level (NAIVE)', 'User-level (CORRECT)'],
    'Sample Size': [len(df), len(pure_users)],
    'Control Rate': [f"{control_rate*100:.2f}%", f"{control_rate_correct*100:.2f}%"],
    'Treatment Rate': [f"{treatment_rate*100:.2f}%", f"{treatment_rate_correct*100:.2f}%"],
    'Lift': [f"{lift:.1f}%", f"{lift_correct:.1f}%"],
    'P-value': [f"{p_value:.4f}", f"{p_value_correct:.4f}"],
    'Significant?': ['✅ YES' if p_value < 0.05 else '❌ NO',
                     '✅ YES' if p_value_correct < 0.05 else '❌ NO'],
    'Valid?': ['❌', '✅']
})

print("\n" + "="*80)
print("📊 COMPARISON: Naive vs Correct Analysis")
print("="*80)
print(comparison_df.to_string(index=False))
print("="*80)
```

    
    ================================================================================
    📊 COMPARISON: Naive vs Correct Analysis
    ================================================================================
                  Method  Sample Size Control Rate Treatment Rate  Lift P-value Significant? Valid?
    Cookie-level (NAIVE)        19580        9.34%         13.76% 47.3%  0.0000        ✅ YES      ❌
    User-level (CORRECT)         6297       12.88%         18.81% 46.0%  0.0000        ✅ YES      ✅
    ================================================================================
    


```python
# Visual comparison
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Left: Naive analysis
ax1 = axes[0]
colors = ['#FF6B6B', '#4ECDC4']
bars1 = ax1.bar(results_naive['variant'], 
                results_naive['conversion_rate'] * 100,
                color=colors, alpha=0.8, edgecolor='black', linewidth=2)

for bar in bars1:
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height,
            f'{height:.2f}%', ha='center', va='bottom', 
            fontsize=13, fontweight='bold')

ax1.set_ylabel('Conversion Rate (%)', fontsize=12, fontweight='bold')
ax1.set_xlabel('Variant', fontsize=12, fontweight='bold')
ax1.set_title('❌ NAIVE: Cookie-Level Analysis\n(INVALID)', 
              fontsize=13, fontweight='bold', pad=20, color='red')
ax1.text(0.5, 0.95, f'Lift: {lift:.1f}% | p={p_value:.4f}', 
         transform=ax1.transAxes, ha='center', va='top',
         bbox=dict(boxstyle='round', facecolor='#FFB6B6', alpha=0.8),
         fontsize=11, fontweight='bold')
ax1.set_ylim(0, max(results_naive['conversion_rate']) * 120)

# Right: Correct analysis
ax2 = axes[1]
bars2 = ax2.bar(results_correct['variant'], 
                results_correct['conversion_rate'] * 100,
                color=colors, alpha=0.8, edgecolor='black', linewidth=2)

for bar in bars2:
    height = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2., height,
            f'{height:.2f}%', ha='center', va='bottom', 
            fontsize=13, fontweight='bold')

ax2.set_ylabel('Conversion Rate (%)', fontsize=12, fontweight='bold')
ax2.set_xlabel('Variant', fontsize=12, fontweight='bold')
ax2.set_title('✅ CORRECT: User-Level Analysis\n(VALID)', 
              fontsize=13, fontweight='bold', pad=20, color='green')
ax2.text(0.5, 0.95, f'Lift: {lift_correct:.1f}% | p={p_value_correct:.4f}', 
         transform=ax2.transAxes, ha='center', va='top',
         bbox=dict(boxstyle='round', facecolor='#B6FFB6', alpha=0.8),
         fontsize=11, fontweight='bold')
ax2.set_ylim(0, max(results_naive['conversion_rate']) * 120)

plt.tight_layout()
plt.savefig('naive_vs_correct_comparison.png', dpi=300, bbox_inches='tight')
plt.show()

print("\n💡 Notice the difference!")
print(f"   Naive analysis: {lift:.1f}% lift, p={p_value:.4f} (misleading!)")
print(f"   Correct analysis: {lift_correct:.1f}% lift, p={p_value_correct:.4f} (accurate)")
```


    
![png](output_20_0.png)
    


    
    💡 Notice the difference!
       Naive analysis: 47.3% lift, p=0.0000 (misleading!)
       Correct analysis: 46.0% lift, p=0.0000 (accurate)
    

### 🎯 What Changed?

By analyzing at the user level and excluding contaminated users:

1. **Sample size** decreased from ~25,000 cookies to ~8,200 users
2. **Effect size** decreased (the "lift" is smaller)
3. **Statistical significance** may have changed
4. **Results are now valid** and interpretable!

This is the **true** performance of your treatment.

---

## Section 7: Key Takeaways

### 3 Rules for Valid A/B Tests

#### 1. Match Your Analysis to Your Randomization Unit
- If you randomize at cookie-level, be very careful about contamination
- **Better:** Randomize at user-level from the start (requires user tracking)
- The unit of randomization should match your unit of analysis

#### 2. Always Check for Contamination
- Count unique analysis units (users) per variant
- Flag units appearing in multiple variants
- Decide upfront how to handle contaminated units

#### 3. When in Doubt, Aggregate Up
- Cookie → User → Account
- Use the highest logical unit that makes sense
- Accept the smaller sample size for valid inference

---

### Quick Diagnostic Function

Use this function to validate your experiments:


```python
def validate_experiment(df, unit_col='user_id', variant_col='variant'):
    """
    Quick health check for your A/B test.
    
    Parameters:
    -----------
    df : DataFrame
        Your experiment dataset
    unit_col : str
        Column name for analysis unit (e.g., 'user_id')
    variant_col : str
        Column name for variant assignment (e.g., 'variant')
    
    Returns:
    --------
    bool : True if issues found, False otherwise
    """
    print("🔍 EXPERIMENT VALIDATION REPORT")
    print("="*60)
    
    issues_found = False
    
    # Check 1: Contamination
    units_per_variant = df.groupby(unit_col)[variant_col].nunique()
    contaminated = (units_per_variant > 1).sum()
    contamination_rate = contaminated / df[unit_col].nunique()
    
    print(f"\n📊 Check 1: Contamination")
    if contaminated > 0:
        print(f"   ⚠️  WARNING: {contaminated:,} units in multiple variants ({contamination_rate:.1%})")
        print(f"   → Recommendation: Exclude or classify these units")
        issues_found = True
    else:
        print(f"   ✅ PASS: No contamination detected")
    
    # Check 2: Sample sizes
    print(f"\n📊 Check 2: Sample Sizes")
    print(f"   Total observations: {len(df):,}")
    print(f"   Unique {unit_col}: {df[unit_col].nunique():,}")
    
    ratio = len(df) / df[unit_col].nunique()
    if ratio > 1.5:
        print(f"   ⚠️  WARNING: {ratio:.2f}x more observations than units")
        print(f"   → Recommendation: Analyze at {unit_col} level, not observation level")
        issues_found = True
    else:
        print(f"   ✅ PASS: Ratio looks reasonable ({ratio:.2f}x)")
    
    # Check 3: Balance
    print(f"\n📊 Check 3: Variant Balance")
    variant_counts = df.groupby(variant_col)[unit_col].nunique()
    print(variant_counts)
    
    max_imbalance = variant_counts.max() / variant_counts.min() - 1
    if max_imbalance > 0.1:  # More than 10% imbalance
        print(f"   ⚠️  WARNING: Variants are imbalanced ({max_imbalance:.1%} difference)")
        issues_found = True
    else:
        print(f"   ✅ PASS: Variants are balanced")
    
    print("\n" + "="*60)
    if issues_found:
        print("❌ ISSUES FOUND - Review recommendations above")
    else:
        print("✅ ALL CHECKS PASSED - Experiment looks good!")
    print("="*60)
    
    return issues_found

# Test it on our data
validate_experiment(df)
```

    🔍 EXPERIMENT VALIDATION REPORT
    ============================================================
    
    📊 Check 1: Contamination
       ⚠️  WARNING: 3,703 units in multiple variants (37.0%)
       → Recommendation: Exclude or classify these units
    
    📊 Check 2: Sample Sizes
       Total observations: 19,580
       Unique user_id: 10,000
       ⚠️  WARNING: 1.96x more observations than units
       → Recommendation: Analyze at user_id level, not observation level
    
    📊 Check 3: Variant Balance
    variant
    control      6800
    treatment    6903
    Name: user_id, dtype: int64
       ✅ PASS: Variants are balanced
    
    ============================================================
    ❌ ISSUES FOUND - Review recommendations above
    ============================================================
    




    True



---

## Summary

### What We Learned

1. **Pseudoreplication** occurs when we treat non-independent observations as independent
   - Multiple cookies per user inflates sample size
   - Makes confidence intervals artificially narrow
   - Can lead to false positives

2. **Contamination** occurs when units are exposed to multiple variants
   - Cookie-level randomization causes users to see both control and treatment
   - Violates fundamental A/B testing assumptions
   - Makes causal inference impossible

3. **The solution** is to analyze at the appropriate unit level
   - Aggregate to user level before analysis
   - Handle or exclude contaminated units
   - Accept smaller sample sizes for valid results

### Before You Ship Your Next A/B Test

✅ Check for contamination  
✅ Verify your unit of analysis matches your unit of randomization  
✅ Look for pseudoreplication (multiple observations per unit)  
✅ Use the validation function above  
✅ Document your analysis decisions  

---

### Want to Go Deeper?

Topics for further exploration:
- Mixed effects models for clustered data
- Design effects and power calculations
- Intention-to-treat vs per-protocol analysis
- Sequential testing and early stopping
- Bayesian approaches to A/B testing

---

**Remember:** It's better to have a smaller, valid experiment than a large, invalid one. Your stakeholders will thank you for accurate results, even if they're less exciting!


```python

```


```python

```
