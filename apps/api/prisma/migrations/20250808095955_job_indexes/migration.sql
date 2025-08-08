-- CreateIndex
CREATE INDEX "Company_name_idx" ON "public"."Company"("name");

-- CreateIndex
CREATE INDEX "JobPost_postedAt_idx" ON "public"."JobPost"("postedAt");

-- CreateIndex
CREATE INDEX "JobPost_title_idx" ON "public"."JobPost"("title");

-- CreateIndex
CREATE INDEX "JobPost_scrapedAt_idx" ON "public"."JobPost"("scrapedAt");
