# EchoDesk Ecommerce Template - Development Guidelines

## API Usage

**ALWAYS use generated API functions** from `src/api/generated/api.ts` instead of manual `axiosInstance` calls.

### Rules:
1. Check `src/api/generated/api.ts` first for any API call you need
2. If the function exists in generated code, USE IT — never write manual axios calls
3. If the function is MISSING from generated code, it means the backend schema doesn't expose it properly
   - Fix the backend OpenAPI schema (add `@extend_schema` decorators)
   - Run `npm run generate` to regenerate types
   - Then use the newly generated function
4. Use generated interfaces from `src/api/generated/interfaces.ts` for all type annotations
5. Never use `as any` to work around type mismatches — fix the types at the source

### Running type generation:
```bash
API_URL=https://groot.api.echodesk.ge SWAGGER_PATH=/api/ecommerce-client-schema/ npm run generate
```

### Multi-tenant API resolution:
- The storefront uses middleware to resolve tenant from hostname
- `src/api/axios.ts` dynamically sets the base URL based on tenant
- `src/lib/auth.ts` derives API URL from request hostname for server-side auth
- `src/lib/fetch-server.ts` reads `x-tenant-api-url` header from middleware for SSR
