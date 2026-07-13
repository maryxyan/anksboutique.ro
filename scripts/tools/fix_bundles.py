#!/usr/bin/env python3
"""Fix product bundles by removing review feature completely."""
import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    orig = content
    
    # 1. Remove unused review imports (already renamed to _se, _ie, _$)
    content = re.sub(r'd as _se,\s*', '', content)
    content = re.sub(r'g as _ie,\s*', '', content)
    content = re.sub(r'k as _\$,,\s*', '', content)  # handle possible double comma
    
    # 2. Remove q=ie() hook (useCreateReview)
    # Pattern: F=re(),H=ae(),q=ie()
    content = re.sub(r',q=ie\(\)', '', content)
    
    # 3. Remove the handleReviewSubmit function (V=s=>{...})
    # Find the V= function - it starts with ,V= and ends at the next function/variable
    m = re.search(r',V=[a-z]+=>\{', content)
    if m:
        start = m.start()
        # Find matching brace
        depth = 0
        i = m.end() - 1  # start from the opening {
        while i < len(content):
            if content[i] == '{':
                depth += 1
            elif content[i] == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    content = content[:start] + content[end:]
                    break
            i += 1
    
    # 4. Remove aggregateRating and review from JSON-LD
    # Pattern: t.reviewCount>0&&t.rating&&(h.aggregateRating={...reviews...});
    m = re.search(r't\.reviewCount>\d+&&t\.rating&&\(', content)
    if m:
        start = m.start()
        # Find the end of this expression (it ends with ));
        # Find the matching paren after &&(
        depth = 0
        i = m.end() - 1  # start at the ( before h.aggregateRating
        while i < len(content):
            if content[i] == '(':
                depth += 1
            elif content[i] == ')':
                depth -= 1
                if depth == 0:
                    # Also consume the following ); 
                    end = i + 1
                    if end < len(content) and content[end] == ';':
                        end += 1
                    content = content[:start] + content[end:]
                    break
            i += 1
    
    # 5. Remove the review star display in product info
    # Pattern: ,t.reviewCount>0&&e.jsxs("div",{className:"flex items-center gap-2 text-sm text-muted-foreground",children:[...]})
    # This appears right after the price span closing
    marker = 't.reviewCount>0&&e.jsxs("div",{className:"flex items-center gap-2 text-sm text-muted-foreground"'
    idx = content.find(marker)
    if idx >= 0:
        # Go back to find the preceding comma
        start = idx - 1
        if start >= 0 and content[start] == ',':
            # Now find the matching close of this jsx expression
            # Count brackets/braces
            depth = 0
            i = idx
            while i < len(content):
                c = content[i]
                if c == '"' or c == "'":
                    # Skip string
                    i += 1
                    while i < len(content):
                        if content[i] == '\\':
                            i += 2
                            continue
                        if content[i] == c:
                            break
                        i += 1
                elif c in '({[':
                    depth += 1
                elif c in ')}]':
                    depth -= 1
                    if depth <= 0:
                        content = content[:start] + content[i+1:]
                        break
                i += 1
    
    # 6. Remove the entire Reviews section at the end
    # Find: ,e.jsxs("div",{className:"mt-24 border-t border-border/40 pt-16",...REVIEWS...})
    # and remove it including its closing brackets
    marker2 = 'mt-24 border-t border-border/40 pt-16'
    idx2 = content.find(marker2)
    if idx2 >= 0:
        # Find the start (go back to the comma)
        start = idx2
        while start > 0 and content[start] != ',':
            start -= 1
        
        # Now count brackets/braces to find where this expression ends
        # The expression starts at the 'e' of e.jsxs
        expr_start = start + 1
        depth = 0
        i = expr_start
        while i < len(content):
            c = content[i]
            if c == '"' or c == "'":
                i += 1
                while i < len(content):
                    if content[i] == '\\':
                        i += 2
                        continue
                    if content[i] == c:
                        break
                    i += 1
            elif c in '({[':
                depth += 1
            elif c in ')}]':
                depth -= 1
                if depth <= 0:
                    content = content[:start] + content[i+1:]
                    break
            i += 1
    
    # 7. Fix import: remove double/trailing commas
    content = re.sub(r',\s*,', ',', content)
    content = re.sub(r',\}', '}', content)
    
    if content != orig:
        print(f"  ✅ {filepath}: {len(orig)} -> {len(content)} chars (removed {len(orig) - len(content)})")
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    else:
        print(f"  ⚠️  {filepath}: No changes made")
        return False

base = "/home/r142031anks"

# Product files
product_files = [
    "public_html/assets/product-B91c6t_3.js",
    "www/assets/product-B91c6t_3.js",
    "temp_repo/artifacts/ank-boutique/dist/public/assets/product-B91c6t_3.js",
]

# Other files with review imports
other_files = [
    "public_html/assets/index-CpTqSf3i.js",
    "public_html/assets/index-D54JI4Ff.js",
    "public_html/assets/account-k9JwEEk0.js",
    "public_html/assets/index-DhgabOBO.js",
    "www/assets/index-CpTqSf3i.js",
    "www/assets/index-D54JI4Ff.js",
    "www/assets/account-k9JwEEk0.js",
    "www/assets/index-DhgabOBO.js",
    "temp_repo/artifacts/ank-boutique/dist/public/assets/index-DhgabOBO.js",
    "temp_repo/artifacts/ank-boutique/dist/public/assets/account-k9JwEEk0.js",
]

print("=== Processing product bundles ===")
for f in product_files:
    fp = os.path.join(base, f)
    if os.path.exists(fp):
        fix_file(fp)

print()
print("=== Cleaning up imports in other files ===")
for f in other_files:
    fp = os.path.join(base, f)
    if not os.path.exists(fp):
        continue
    with open(fp, 'r') as fh:
        content = fh.read()
    orig = content
    content = re.sub(r'd as se,\s*', '', content)
    content = re.sub(r'g as ie,\s*', '', content)
    content = re.sub(r'k as \$,,\s*', '', content)
    content = re.sub(r',\s*,', ',', content)
    if content != orig:
        with open(fp, 'w') as fh:
            fh.write(content)
        print(f"  ✅ {fp}: cleaned up imports")
    else:
        print(f"  - {fp}: no changes")
