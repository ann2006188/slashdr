package com.slashdr.backend;

import com.slashdr.backend.entity.ConsentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsentTemplateRepository extends JpaRepository<ConsentTemplate, Long> {
}