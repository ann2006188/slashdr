package com.slashdr.backend;

import com.slashdr.backend.entity.ClinicLicense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicLicenseRepository extends JpaRepository<ClinicLicense, Long> {

    // Spring Data JPA writes the actual query for us just from this method name -
    // "find all rows where clinicId equals the value we pass in"
    List<ClinicLicense> findByClinicId(String clinicId);
}