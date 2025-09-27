# PDF Header Alignment Guide

## Logo and Company Name Alignment

### Before Alignment:
```
[Logo at (14,9)]     Trash2Cash at (35,18)
                     Monthly Salary Slip at (35,25)
```

### After Alignment (Current):
```
[Logo at (14,9)]     Trash2Cash at (30,16) ← Better aligned
                     Monthly Salary Slip at (30,23) ← Consistent spacing
```

### Visual Layout:
```
┌────────────────────────────────────────────────┐
│  ⭕ Trash2Cash                    Period: Aug   │
│     No 23/A, Kandy Road, Malabe               │
│     Monthly Salary Slip         Generated: ... │
└────────────────────────────────────────────────┘
```

### Positioning Details:

**Logo:**
- Position: (14, 9) - 12mm x 12mm
- White circle background at (20, 15) with 8mm radius

**Company Name:**
- "Trash2Cash": Position (30, 16)
- Font: Helvetica Bold, 16pt
- Color: White

**Company Address:**
- "No 23/A, Kandy Road, Malabe": Position (30, 20)
- Font: Helvetica Normal, 9pt
- Color: White

**Subtitle:**
- "Monthly Salary Slip": Position (30, 25)  
- Font: Helvetica Normal, 11pt
- Color: White

### Alignment Benefits:
1. **Vertical Alignment**: Logo and text are now center-aligned
2. **Consistent Spacing**: 7pt spacing between title and subtitle
3. **Professional Look**: Better visual balance in header
4. **Readable**: Proper spacing from logo edge