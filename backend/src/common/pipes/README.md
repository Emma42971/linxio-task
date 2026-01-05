# Global Validation Pipe - Documentation

## 📋 Vue d'ensemble

Le `GlobalValidationPipe` est configuré globalement pour valider et transformer automatiquement tous les DTOs de l'application. Il supporte la validation des objets imbriqués avec une transformation automatique des types.

## ✨ Fonctionnalités

### 1. Whitelist Validation
- **Strips unknown properties** : Supprime automatiquement les propriétés qui n'ont pas de décorateurs de validation
- **Forbids non-whitelisted properties** : Lance une erreur si des propriétés non autorisées sont présentes

### 2. Transformation Automatique
- **Type conversion** : Convertit automatiquement les types (string → number, string → boolean, etc.)
- **Nested objects** : Transforme automatiquement les objets imbriqués
- **Arrays** : Supporte la transformation des tableaux
- **Default values** : Expose les valeurs par défaut définies dans les classes

### 3. Validation des Objets Imbriqués

Pour valider des objets imbriqués, utilisez `@ValidateNested()` et `@Type()` :

```typescript
import { IsString, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zipCode: string;
}

class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested() // ✅ Nécessaire pour valider l'objet imbriqué
  @Type(() => AddressDto) // ✅ Nécessaire pour transformer l'objet imbriqué
  @IsOptional()
  address?: AddressDto;
}
```

### 4. Validation des Tableaux d'Objets

Pour valider des tableaux d'objets imbriqués :

```typescript
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class TagDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

class CreateTaskDto {
  @ApiProperty({ type: [TagDto] })
  @IsArray()
  @ValidateNested({ each: true }) // ✅ Valide chaque élément du tableau
  @Type(() => TagDto) // ✅ Transforme chaque élément
  @ArrayMinSize(1)
  tags: TagDto[];
}
```

## 🔧 Configuration

La configuration est définie dans `validation-pipe.config.ts` :

```typescript
{
  whitelist: true,                    // Supprime les propriétés non autorisées
  forbidNonWhitelisted: true,         // Erreur si propriétés non autorisées
  transform: true,                    // Transformation automatique
  transformOptions: {
    enableImplicitConversion: true,    // Conversion automatique des types
    exposeDefaultValues: true,        // Expose les valeurs par défaut
  },
  stopAtFirstError: false,           // Affiche toutes les erreurs
}
```

## 📝 Exemples d'Utilisation

### Exemple 1 : Objet Imbriqué Simple

```typescript
// DTO
class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => DefaultProjectDto)
  @IsOptional()
  defaultProject?: DefaultProjectDto;
}

// Requête JSON
{
  "name": "Acme Corp",
  "defaultProject": {
    "name": "First Project"
  }
}

// ✅ Transformé automatiquement en instance de DefaultProjectDto
// ✅ Validé automatiquement
```

### Exemple 2 : Tableau d'Objets Imbriqués

```typescript
// DTO
class CreateTaskDto {
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssigneeDto)
  assignees: AssigneeDto[];
}

// Requête JSON
{
  "title": "New Task",
  "assignees": [
    { "userId": "123", "role": "DEVELOPER" },
    { "userId": "456", "role": "REVIEWER" }
  ]
}

// ✅ Chaque élément du tableau est transformé et validé
```

### Exemple 3 : Conversion Automatique de Types

```typescript
// DTO
class CreateTaskDto {
  @IsInt()
  storyPoints: number;

  @IsBoolean()
  isCompleted: boolean;
}

// Requête JSON (tous les types sont convertis automatiquement)
{
  "storyPoints": "8",      // ✅ Converti en number
  "isCompleted": "true"   // ✅ Converti en boolean
}
```

## ⚠️ Erreurs de Validation

### Format des Erreurs

Les erreurs de validation sont formatées de manière structurée :

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "name": ["name should not be empty"],
    "email": ["email must be an email"],
    "address": {
      "street": ["street should not be empty"],
      "zipCode": ["zipCode must be a string"]
    }
  }
}
```

### Erreurs Courantes

#### 1. Objet Imbriqué Non Transformé

**Problème** :
```typescript
// ❌ Manque @Type()
@ValidateNested()
address: AddressDto; // Ne sera pas transformé
```

**Solution** :
```typescript
// ✅ Ajouter @Type()
@ValidateNested()
@Type(() => AddressDto)
address: AddressDto;
```

#### 2. Tableau d'Objets Non Validé

**Problème** :
```typescript
// ❌ Manque { each: true }
@ValidateNested()
@Type(() => TagDto)
tags: TagDto[];
```

**Solution** :
```typescript
// ✅ Ajouter { each: true }
@ValidateNested({ each: true })
@Type(() => TagDto)
tags: TagDto[];
```

## 🧪 Tests

Pour tester la validation :

```typescript
// Test unitaire
describe('CreateTaskDto', () => {
  it('should validate nested objects', async () => {
    const dto = plainToInstance(CreateTaskDto, {
      title: 'Test',
      assignees: [{ userId: '123' }],
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
```

## 📚 Ressources

- [class-validator Documentation](https://github.com/typestack/class-validator)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)


