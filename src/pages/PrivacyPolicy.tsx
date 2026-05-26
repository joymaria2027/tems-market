import Layout from "@/components/layout/Layout";

const PrivacyPolicy = () => (
  <Layout>
    <div className="container py-12 md:py-20 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
        Privacy Policy
      </h1>
      <div className="prose prose-sm text-muted-foreground space-y-6">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            When you create an account on Tems Market, we collect your phone number, full name,
            date of birth, and account type. When you make a purchase, we collect transaction details
            including payment information processed securely through ModemPay.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>
            We use your information to provide and improve our marketplace services, process
            transactions, verify your identity, communicate with you about orders, and ensure
            platform security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. Data Sharing</h2>
          <p>
            We share your information only as needed to fulfil orders (with vendors), process
            payments (with ModemPay), and comply with legal obligations. We do not sell your
            personal data to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including
            encrypted connections, secure authentication, and access controls. Payment
            information is handled by our PCI-compliant payment processor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data at any
            time by contacting us. You can also update your account information directly through
            your account settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or your data, please contact us at{" "}
            <span className="font-medium text-foreground">privacy@temsmarket.com</span>.
          </p>
        </section>
      </div>
    </div>
  </Layout>
);

export default PrivacyPolicy;
