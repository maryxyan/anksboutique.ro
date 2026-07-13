#!/usr/bin/env python3
"""Remove review feature from compiled product JS bundles."""
import re
import os

def remove_reviews_from_bundle(content):
    """Remove all review-related code from a bundled JS file."""
    
    # Step 1: Remove review import aliases from the import line
    # Pattern: import{...d as se,...g as ie,...k as $,...}
    content = re.sub(
        r'(import\{[^}]*)d as se,([^}]*\})',
        r'\1d as _se,\2',
        content
    )
    content = re.sub(
        r'(import\{[^}]*)g as ie,([^}]*\})',
        r'\1g as _ie,\2',
        content
    )
    content = re.sub(
        r'(import\{[^}]*)k as \$,([^}]*\})',
        r'\1k as _\$,\2',
        content
    )
    
    # Step 2: Remove review data query hook call
    # Pattern: ,{data:o}=se(r,{query:{enabled:!!r,queryKey:$(r)}})
    content = re.sub(
        r',\{data:[a-z]+\}=[a-z_]+\([^,]+,\{query:\{enabled:[^}]+,queryKey:\$\([^)]+\)\}\}\)',
        '',
        content
    )
    
    # Step 3: Remove useCreateReview hook
    # Pattern: ,q=ie()
    content = re.sub(r',q=ie\(\)', '', content)
    
    # Step 4: Remove review state variables
    # Pattern: [w,k]=i.useState(""),[C,S]=i.useState(5),[R,A]=i.useState(""),[G,W]=i.useState(!1),
    content = re.sub(
        r',\[[a-z],k\]=i\.useState\(""\),\[[A-Z],S\]=i\.useState\(5\),\[[A-Z],A\]=i\.useState\(""\),\[[A-Z],W\]=i\.useState\(!1\)',
        '',
        content
    )
    
    # Step 5: Remove handleReviewSubmit function (V=...)
    content = re.sub(
        r',V=[a-z]+=>\{[^}]+\.mutate\(\{[^}]+:[^}]+\}(?:\{[^}]*\}[^}]*)*[^}]*\}\)',
        '',
        content,
        count=1
    )
    
    # Step 6: Remove aggregateRating and review from JSON-LD schema
    # Pattern: t.reviewCount>0&&t.rating&&(h.aggregateRating=...o&&o.length>0&&(h.review=...));
    content = re.sub(
        r't\.reviewCount>\d+&&t\.rating&&\([^;]+\);\s*',
        '',
        content
    )
    
    # Step 7: Remove the star rating display in product info
    # Pattern: t.reviewCount>0&&e.jsxs("div",{className:"flex items-center gap-2 text-sm text-muted-foreground",children:[...]})
    # This is complex, let me try a different approach - find and remove
    content = re.sub(
        r',t\.reviewCount>\d+&&e\.jsxs\("div",\{className:"flex items-center gap-2 text-sm text-muted-foreground",children:\[e\.jsx\("div",\{className:"flex",children:\[1,2,3,4,5\]\.map\([^)]+\)\}\),e\.jsxs\("span",\{children:\["\([^)]+\)"\]\}\)\}\)',
        '',
        content
    )
    
    # Step 8: Remove the entire Reviews section
    # Find: ,e.jsxs("div",{className:"mt-24 border-t border-border/40 pt-16",children:[...ALL_REVIEW_STUFF...]})
    # This ends right before }export{he as default};
    # Use a balanced bracket approach
    
    # Find the reviews section start
    review_start_marker = 'mt-24 border-t border-border/40 pt-16'
    idx = content.find(review_start_marker)
    if idx < 0:
        print("  ⚠️  Could not find reviews section marker")
        return content
    
    # Go back to find the start of the e.jsxs expression
    # The pattern is: ,e.jsxs("div",{className:"mt-24 border-t border-border/40 pt-16",...})
    # Go back from the marker to find the preceding comma
    search_start = max(0, idx - 50)
    before_marker = content[search_start:idx]
    
    # Find the last comma before the marker
    comma_pos = before_marker.rfind(',')
    if comma_pos < 0:
        print("  ⚠️  Could not find starting comma for reviews section")
        return content
    
    actual_start = search_start + comma_pos
    
    # Now find the end of the reviews section
    # It ends right before }export{he as default};
    export_pos = content.find('}export{he as default}')
    if export_pos < 0:
        export_pos = content.find('}export{')
    
    if export_pos < 0:
        print("  ⚠️  Could not find export marker")
        return content
    
    # Remove from the reviews start to the export
    # The export closing braces are shared, so we need to adjust
    # After removing the reviews section (which is the last element in the array),
    # we need to close the remaining brackets properly
    
    # The reviews section ends with some closing braces that also close the parent elements
    # We need to figure out how many closing braces are from the reviews section itself
    # vs. from the parent elements
    
    # Actually, let me look at the end of the file more carefully
    # The structure is: ...],[REVIEWS_SECTION]]))}export{default}
    # We need to remove everything from the reviews start to just before the closing
    # of the container div
    
    # From the reviews start comma to the export
    reviews_code = content[actual_start:export_pos]
    
    # Now I need to count brackets to find where the reviews section closes
    # and the parent container starts closing
    # The reviews section is: e.jsxs("div",{...children:[...]})
    # After that: ]) closes container children, )} closes container div and Layout
    
    # Actually, a simpler approach: just find the entire reviews JSX expression
    # using bracket counting
    
    expr_start = actual_start
    # Skip the leading comma
    expr_start += 1
    
    # Count brackets from the start of the expression
    depth = 0
    in_string = False
    string_char = None
    escape = False
    end_pos = expr_start
    
    for i in range(expr_start, export_pos):
        c = content[i]
        
        if escape:
            escape = False
            continue
        
        if in_string:
            if c == '\\':
                escape = True
            elif c == string_char:
                in_string = False
            continue
        
        if c == '"' or c == "'":
            in_string = True
            string_char = c
            continue
        
        if c == '{' or c == '(' or c == '[':
            depth += 1
        elif c == '}' or c == ')' or c == ']':
            depth -= 1
            if depth <= 0:
                end_pos = i + 1
                break
    
    if depth > 0:
        print(f"  ⚠️  Unbalanced brackets, depth={depth}")
        return content
    
    # Remove from actual_start to end_pos
    new_content = content[:actual_start] + content[end_pos:]
    
    # Now the remaining closing sequence should be correct
    # because we removed the entire JSX expression including its closing brackets
    
    print(f"  ✅ Removed reviews section ({end_pos - actual_start} chars)")
    return new_content

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_len = len(content)
    new_content = remove_reviews_from_bundle(content)
    
    # Remove useListProductReviews import alias (was renamed above)
    # Also remove getListProductReviewsQueryKey
    new_content = new_content.replace('d as _se,', '')
    new_content = new_content.replace('g as _ie,', '')
    new_content = new_content.replace('k as _$,', '')
    
    # Also clean up double commas from imports
    new_content = re.sub(r',\s*,', ',', new_content)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"  {'✅' if len(new_content) < original_len else '❌'} {filepath}: {original_len} -> {len(new_content)} chars (removed {original_len - len(new_content)})")

# Files that contain review code (product page bundle)
FILES = [
    "public_html/assets/product-B91c6t_3.js",
    "www/assets/product-B91c6t_3.js",
    "temp_repo/artifacts/ank-boutique/dist/public/assets/product-B91c6t_3.js",
]

# Files that might contain review text from old versions
OTHER_FILES = [
    "public_html/assets/index-CpTqSf3i.js",
    "public_html/assets/index-D54JI4Ff.js",
    "public_html/assets/account-k9JwEEk0.js",
    "www/assets/index-CpTqSf3i.js",
    "www/assets/index-D54JI4Ff.js",
    "www/assets/account-k9JwEEk0.js",
    "temp_repo/artifacts/ank-boutique/dist/public/assets/account-k9JwEEk0.js",
]

base = "/home/r142031anks"

for f in FILES:
    process_file(os.path.join(base, f))

for f in OTHER_FILES:
    filepath = os.path.join(base, f)
    if os.path.exists(filepath):
        with open(filepath, 'r') as fh:
            content = fh.read()
        # Just remove any remaining review text strings
        old_len = len(content)
        # Remove review-related text strings in import
        content = re.sub(r'd as se,', '', content)
        content = re.sub(r'g as ie,', '', content)
        content = re.sub(r'k as \$,', '', content)
        content = re.sub(r',\s*,', ',', content)
        if len(content) != old_len:
            with open(filepath, 'w') as fh:
                fh.write(content)
            print(f"  Updated imports in {filepath}")
        else:
            print(f"  No changes needed for {filepath}")
