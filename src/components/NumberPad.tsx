import React from 'react';
import { Delete } from 'lucide-react';
import { cn } from '../lib/utils';

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  allowDecimal?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  value,
  onChange,
  maxLength = 12,
  allowDecimal = true,
  className,
  size = 'md',
  disabled = false
}) => {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const hasDecimal = value.includes('.');

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      button: 'h-12 text-lg',
      deleteButton: 'h-12'
    },
    md: {
      container: 'gap-2',
      button: 'h-16 text-xl',
      deleteButton: 'h-16'
    },
    lg: {
      container: 'gap-3',
      button: 'h-20 text-2xl',
      deleteButton: 'h-20'
    }
  };

  const handleNumberPress = (num: string) => {
    if (disabled) return;
    
    if (value.length >= maxLength) return;
    
    // 첫 번째 입력이 0이고 소수점이 아닌 경우 방지
    if (value === '0' && num !== '.') {
      onChange(num);
      return;
    }
    
    onChange(value + num);
  };

  const handleDecimalPress = () => {
    if (disabled || !allowDecimal || hasDecimal) return;
    
    if (value === '') {
      onChange('0.');
    } else {
      onChange(value + '.');
    }
  };

  const handleZeroPress = () => {
    if (disabled) return;
    
    if (value.length >= maxLength) return;
    
    // 값이 비어있거나 '0'인 경우 '0' 추가 방지 (소수점 이후는 허용)
    if (value === '' || (value === '0' && !hasDecimal)) return;
    
    onChange(value + '0');
  };

  const handleDelete = () => {
    if (disabled) return;
    
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const NumberButton: React.FC<{
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
  }> = ({ children, onClick, className: buttonClassName }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        sizeClasses[size].button,
        buttonClassName
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('grid grid-cols-3', sizeClasses[size].container, className)}>
      {/* Numbers 1-9 */}
      {numbers.map((num) => (
        <NumberButton
          key={num}
          onClick={() => handleNumberPress(num)}
        >
          {num}
        </NumberButton>
      ))}

      {/* Bottom row: Decimal/Clear, 0, Delete */}
      <NumberButton
        onClick={allowDecimal ? handleDecimalPress : handleClear}
        className={cn(
          allowDecimal && hasDecimal && 'opacity-50 cursor-not-allowed',
          !allowDecimal && 'bg-red-100 hover:bg-red-200 text-red-700'
        )}
      >
        {allowDecimal ? '.' : 'C'}
      </NumberButton>

      <NumberButton onClick={handleZeroPress}>
        0
      </NumberButton>

      <NumberButton
        onClick={handleDelete}
        className="bg-red-100 hover:bg-red-200 text-red-700"
      >
        <Delete className="w-5 h-5" />
      </NumberButton>
    </div>
  );
};

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  placeholder?: string;
  maxLength?: number;
  allowDecimal?: boolean;
  showNumberPad?: boolean;
  className?: string;
  inputClassName?: string;
  numberPadSize?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  currency = 'XRP',
  placeholder = '0',
  maxLength = 12,
  allowDecimal = true,
  showNumberPad = true,
  className,
  inputClassName,
  numberPadSize = 'md',
  disabled = false,
  error
}) => {
  const formatDisplayValue = (val: string): string => {
    if (!val) return placeholder;
    
    // 숫자 형식으로 포맷팅
    const numericValue = parseFloat(val);
    if (isNaN(numericValue)) return val;
    
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(numericValue);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Amount Display */}
      <div className="text-center">
        <div className={cn(
          'text-4xl font-bold text-gray-900 mb-2',
          disabled && 'opacity-50',
          error && 'text-red-600',
          inputClassName
        )}>
          {formatDisplayValue(value)}
        </div>
        <p className="text-gray-500 text-lg">{currency}</p>
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* Number Pad */}
      {showNumberPad && (
        <NumberPad
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          allowDecimal={allowDecimal}
          size={numberPadSize}
          disabled={disabled}
        />
      )}
    </div>
  );
};

interface QuickAmountButtonsProps {
  amounts: number[];
  onSelect: (amount: number) => void;
  currentValue?: string;
  currency?: string;
  className?: string;
  disabled?: boolean;
}

export const QuickAmountButtons: React.FC<QuickAmountButtonsProps> = ({
  amounts,
  onSelect,
  currentValue = '',
  currency = 'XRP',
  className,
  disabled = false
}) => {
  const isSelected = (amount: number): boolean => {
    return parseFloat(currentValue) === amount;
  };

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {amounts.map((amount) => (
        <button
          key={amount}
          onClick={() => onSelect(amount)}
          disabled={disabled}
          className={cn(
            'px-4 py-3 rounded-lg font-medium transition-all duration-150',
            'border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isSelected(amount)
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          {amount} {currency}
        </button>
      ))}
    </div>
  );
};

interface CalculatorModeProps {
  value: string;
  onChange: (value: string) => void;
  onCalculate?: (result: number) => void;
  className?: string;
  disabled?: boolean;
}

export const CalculatorMode: React.FC<CalculatorModeProps> = ({
  value,
  onChange,
  onCalculate,
  className,
  disabled = false
}) => {
  const operators = ['+', '-', '*', '/'];
  
  const handleOperatorPress = (operator: string) => {
    if (disabled) return;
    
    // 마지막 문자가 이미 연산자인 경우 교체
    const lastChar = value.slice(-1);
    if (operators.includes(lastChar)) {
      onChange(value.slice(0, -1) + operator);
    } else if (value) {
      onChange(value + operator);
    }
  };

  const handleCalculate = () => {
    if (disabled) return;
    
    try {
      // 안전한 계산을 위해 eval 대신 Function 사용
      const result = Function(`"use strict"; return (${value})`)();
      
      if (typeof result === 'number' && !isNaN(result)) {
        const roundedResult = Math.round(result * 1000000) / 1000000; // 6자리 소수점
        onChange(roundedResult.toString());
        onCalculate?.(roundedResult);
      }
    } catch (error) {
      console.error('계산 오류:', error);
      // 오류 시 아무것도 하지 않음
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* 계산식 표시 */}
      <div className="bg-gray-100 p-3 rounded-lg">
        <p className="text-lg font-mono text-gray-700">
          {value || '0'}
        </p>
      </div>

      {/* 연산자 버튼들 */}
      <div className="grid grid-cols-4 gap-2">
        {operators.map((op) => (
          <button
            key={op}
            onClick={() => handleOperatorPress(op)}
            disabled={disabled}
            className={cn(
              'h-12 flex items-center justify-center rounded-lg font-medium',
              'bg-blue-100 hover:bg-blue-200 text-blue-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            {op}
          </button>
        ))}
      </div>

      {/* 계산 버튼 */}
      <button
        onClick={handleCalculate}
        disabled={disabled || !value}
        className={cn(
          'w-full h-12 rounded-lg font-medium',
          'bg-green-600 hover:bg-green-700 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
        )}
      >
        계산하기 (=)
      </button>
    </div>
  );
};

export default NumberPad;