package cm.gov.pki;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PKISouverainApplication {

	public static void main(String[] args) {
		SpringApplication.run(PKISouverainApplication.class, args);
	}
}
