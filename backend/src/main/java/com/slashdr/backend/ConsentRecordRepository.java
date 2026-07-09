package com.slashdr.backend;

import com.slashdr.backend.entity.ConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, Long> {

    List<ConsentRecord> findByClinicId(String clinicId);
}