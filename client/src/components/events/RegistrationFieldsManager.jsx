import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const RegistrationFieldsManager = ({ fields, onChange }) => {
  const [localFields, setLocalFields] = useState(fields || []);

  const handleAddField = () => {
    const newField = {
      fieldName: `field_${Date.now()}`,
      fieldType: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
      order: localFields.length
    };
    const updated = [...localFields, newField];
    setLocalFields(updated);
    onChange(updated);
  };

  const handleRemoveField = (index) => {
    const updated = localFields.filter((_, i) => i !== index);
    setLocalFields(updated);
    onChange(updated);
  };

  const handleFieldChange = (index, key, value) => {
    const updated = [...localFields];
    updated[index] = { ...updated[index], [key]: value };
    setLocalFields(updated);
    onChange(updated);
  };

  const handleOptionsChange = (index, optionsString) => {
    const options = optionsString.split(',').map(opt => opt.trim()).filter(Boolean);
    handleFieldChange(index, 'options', options);
  };

  return (
    <Container>
      <Header>
        <h4>Registration Form Fields</h4>
        <p>Customize what information you want to collect from attendees</p>
      </Header>

      {localFields.length === 0 ? (
        <EmptyState>
          <p>No custom fields added yet. Phone number is collected by default.</p>
          <AddButton type="button" onClick={handleAddField}>
            <Plus size={18} />
            Add Custom Field
          </AddButton>
        </EmptyState>
      ) : (
        <FieldsList>
          {localFields.map((field, index) => (
            <FieldItem key={index}>
              <FieldHeader>
                <GripVertical size={18} color="#9ca3af" />
                <span>Field {index + 1}</span>
                <RemoveButton type="button" onClick={() => handleRemoveField(index)}>
                  <Trash2 size={16} />
                </RemoveButton>
              </FieldHeader>

              <FieldRow>
                <FieldGroup>
                  <Label>Field Label *</Label>
                  <Input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                    placeholder="e.g., Dietary Preferences"
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label>Field Type *</Label>
                  <Select
                    value={field.fieldType}
                    onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value)}
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="number">Number</option>
                    <option value="textarea">Long Text</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </Select>
                </FieldGroup>
              </FieldRow>

              <FieldGroup>
                <Label>Placeholder Text</Label>
                <Input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)}
                  placeholder="Hint text for the field"
                />
              </FieldGroup>

              {field.fieldType === 'select' && (
                <FieldGroup>
                  <Label>Options (comma-separated) *</Label>
                  <Input
                    type="text"
                    value={field.options?.join(', ') || ''}
                    onChange={(e) => handleOptionsChange(index, e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </FieldGroup>
              )}

              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                />
                <span>Required field</span>
              </CheckboxLabel>
            </FieldItem>
          ))}

          <AddButton type="button" onClick={handleAddField}>
            <Plus size={18} />
            Add Another Field
          </AddButton>
        </FieldsList>
      )}
    </Container>
  );
};

const Container = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
`;

const Header = styled.div`
  margin-bottom: 1rem;

  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;

  p {
    color: #6b7280;
    margin-bottom: 1rem;
  }
`;

const FieldsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FieldItem = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
`;

const FieldHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;

  span {
    flex: 1;
    font-weight: 600;
    color: #374151;
  }
`;

const RemoveButton = styled.button`
  padding: 0.5rem;
  background: #fee2e2;
  border: none;
  border-radius: 6px;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fecaca;
  }
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-top: 0.5rem;

  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  span {
    font-size: 0.875rem;
    color: #374151;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4F46E5;
    color: #4F46E5;
    background: #f5f3ff;
  }
`;

export default RegistrationFieldsManager;
