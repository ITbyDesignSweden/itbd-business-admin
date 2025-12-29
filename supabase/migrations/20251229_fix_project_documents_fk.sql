-- Korrigering av felaktig referens i project_documents
-- Från organizations(id) till projects(id)
-- Skapad: 2025-12-29

BEGIN;

-- 1. Ta bort den felaktiga foreign key-begränsningen om den finns
-- Postgres namnger normalt dessa som project_documents_project_id_fkey
-- Vi testar även för organizations_id_fkey utifall den fick ett annat namn
ALTER TABLE project_documents 
DROP CONSTRAINT IF EXISTS project_documents_project_id_fkey;

-- 2. Lägg till den korrekta begränsningen mot projects(id)
-- Vi använder CASCADE för att följa mönstret i den ursprungliga (men felaktiga) definitionen
ALTER TABLE project_documents
ADD CONSTRAINT project_documents_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE CASCADE;

-- 3. Uppdatera kommentar för att förtydliga
COMMENT ON COLUMN project_documents.project_id IS 'Referens till projektet dokumentet tillhör';

COMMIT;


