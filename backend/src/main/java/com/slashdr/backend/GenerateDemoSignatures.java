package com.slashdr.backend;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;

public class GenerateDemoSignatures {
    public static void main(String[] args) throws Exception {
        File dir = new File("uploads");
        if (!dir.exists()) dir.mkdirs();

        String[] patientNames = {
            "", "Rajesh Iyer", "Sunita Rao", "Vivek Mehta", "Aditi Joshi", 
            "Rajesh Iyer", "Rajesh Iyer", "Hari Nair", "Jaspreet Singh", "Aditi Joshi"
        };
        String[] witnessNames = {
            "", "Sanjay Sharma", "Dev Patel", "Kiran Kumar", "", 
            "Neha Malhotra", "Neha Malhotra", "", "Jaspreet Singh"
        };

        for (int i = 1; i <= 9; i++) {
            String name = i < patientNames.length ? patientNames[i] : "Patient Sig";
            generateSigImage(new File(dir, "sig-patient-" + i + ".png"), name);
        }
        for (int i = 1; i <= 8; i++) {
            String name = i < witnessNames.length ? witnessNames[i] : "Witness Sig";
            if (!name.isEmpty()) {
                generateSigImage(new File(dir, "sig-witness-" + i + ".png"), name);
            }
        }
        System.out.println("Demo signatures generated successfully!");
    }

    private static void generateSigImage(File file, String name) throws Exception {
        int width = 300;
        int height = 120;
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();

        // Enable antialiasing for smooth lines
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Draw a baseline/guide
        g.setColor(new Color(99, 102, 241, 40)); // faint indigo line
        g.setStroke(new BasicStroke(1.5f));
        g.drawLine(20, height - 30, width - 20, height - 30);

        // Draw some signature swoops
        g.setStroke(new BasicStroke(2.2f));
        g.setColor(new Color(79, 70, 229)); // Indigo ink
        g.drawArc(30, 40, 60, 40, 180, 270);
        g.drawLine(80, 60, 220, 50);
        g.drawArc(200, 35, 40, 30, 0, 360);
        g.drawLine(210, 65, 260, 75);

        // Draw the name cursive-style
        g.setColor(new Color(17, 24, 39)); // Charcoal ink
        g.setFont(new Font("Georgia", Font.ITALIC, 28));
        g.drawString(name, 50, 70);

        g.dispose();
        ImageIO.write(img, "png", file);
    }
}
